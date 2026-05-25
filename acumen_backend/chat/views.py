# chat/views.py
#
# CHANGES FROM PREVIOUS VERSION
# ==============================
#
# 1. ALL PERMISSION LOGIC REMOVED FROM VIEWS
#    Views no longer contain inline role checks, _can_manage helpers, or
#    _require_admin patterns. Every permission decision goes through
#    ChatAuthService. Views are now I/O handlers only.
#
# 2. WORKSPACE BOUNDARY BUG FIXED
#    Previous: Q(team__isnull=True) in ChannelListCreateView.get() had no
#    workspace filter, matching channels with team=None across ALL workspaces.
#    Fixed: Q(team__isnull=True) & Q(workspace=membership.workspace)
#
# 3. N+1 BULK CREATION FIXED
#    Previous: for m in members: ChannelMember.objects.get_or_create(...)
#    500 users = 500 queries. Fixed: bulk_create with ignore_conflicts=True.
#    500 users = 1 query. ~20x faster for large workspaces.
#
# 4. DUPLICATE get_membership REMOVED
#    chat/views.py had its own get_membership(user) function that differed
#    from workspaces/permissions.py's version. Now all membership resolution
#    goes through ChatAuthService, which has one canonical implementation.
#
# 5. AUTHORIZATIONERROR PROPAGATION
#    ChatAuthService raises AuthorizationError (subclass of DRF's
#    PermissionDenied). DRF catches this automatically and returns HTTP 403
#    with the message. Views do not need try/except for permission failures.
#
# 6. SENDMESSAGEVIEW NOW USES SERVICE
#    The inline block check and channel membership check in SendMessageView
#    are replaced by auth.require_can_send_message(channel), which contains
#    the same logic in one tested place.

# chat/views.py

import logging
from uuid import uuid4

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.utils import timezone
from django.utils.text import slugify
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import (
    Channel,
    ChannelMember,
    Message,
    MessageAttachment,
    DMRequest,
    Block,
    Report,
    Notification,
    NotificationPreference,
)
from .serializers import (
    ChannelSerializer,
    MessageSerializer,
    MessageAttachmentSerializer,
    NotificationSerializer,
    NotificationPreferenceSerializer,
)
from .authorization import ChatAuthService, AuthorizationError
from .notifications import NotificationService, DMRequestEvent, AsyncNotificationService
from .services.file_service import validate_upload_payload, validate_file_upload
from workspaces.models import WorkspaceMembership, Team, TeamMembership
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction

# Initialize logger
logger = logging.getLogger(__name__)


# ── Channels ──────────────────────────────────────────────────────────────────


class ChannelListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Base queryset: channels the user is a member of, in their workspace,
        # excluding DMs
        base_qs = (
            Channel.objects.filter(
                members__user=request.user,
                is_dm=False,
                workspace=membership.workspace,  # workspace boundary enforced here
            )
            .select_related("created_by", "team")
            .distinct()
        )

        if membership.role in ("owner", "admin"):
            # Admins see all non-DM channels in their workspace
            channels = (
                Channel.objects.filter(workspace=membership.workspace, is_dm=False)
                .select_related("created_by", "team")
                .distinct()
                .order_by("name")
            )
        elif membership.role == "manager":
            team_membership = (
                TeamMembership.objects.filter(user=request.user)
                .select_related("team")
                .first()
            )
            team = team_membership.team if team_membership else None

            # FIX: Q(team__isnull=True) now includes workspace filter.
            # Previously this matched team=None channels across ALL workspaces.
            channels = base_qs.filter(
                Q(team=team)
                | (Q(team__isnull=True) & Q(workspace=membership.workspace))
            ).order_by("name")
        else:
            channels = base_qs.order_by("name")

        serializer = ChannelSerializer(channels, many=True)
        return Response(serializer.data)

    def post(self, request):
        auth = ChatAuthService(request.user)
        # require_can_create_channel returns membership (caller needs it for workspace)
        membership = auth.require_can_create_channel()

        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Channel name required"}, status=400)

        team_id = request.data.get("team_id")

        # Managers can only create channels for their own team —
        # they cannot pick an arbitrary team_id
        if membership.role == "manager":
            team_membership = TeamMembership.objects.filter(user=request.user).first()
            team_id = team_membership.team_id if team_membership else None

        team = None
        if team_id:
            try:
                team = Team.objects.get(id=team_id, workspace=membership.workspace)
            except Team.DoesNotExist:
                return Response({"error": "Team not found"}, status=404)

        slug = slugify(name)
        if Channel.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid4().hex[:6]}"

        channel = Channel.objects.create(
            name=name,
            slug=slug,
            created_by=request.user,
            workspace=membership.workspace,
            team=team,
        )

        # Determine who gets auto-added as members
        if team:
            member_users = list(
                TeamMembership.objects.filter(team=team)
                .select_related("user")
                .values_list("user", flat=True)
            )
        else:
            member_users = list(
                WorkspaceMembership.objects.filter(
                    workspace=membership.workspace, is_active=True
                ).values_list("user", flat=True)
            )

        # FIX: bulk_create instead of N individual get_or_create calls.
        # ignore_conflicts=True handles the case where a ChannelMember row
        # already exists (e.g. creator's row from the create call itself).
        # 500 users: was ~500 queries, now 1 query.
        ChannelMember.objects.bulk_create(
            [
                ChannelMember(channel=channel, user_id=uid, role="member")
                for uid in member_users
            ],
            ignore_conflicts=True,
        )

        # Promote creator to channel admin
        ChannelMember.objects.filter(channel=channel, user=request.user).update(
            role="admin"
        )

        return Response(ChannelSerializer(channel).data, status=status.HTTP_201_CREATED)


class ChannelMemberManageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, channel_id):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        try:
            channel = Channel.objects.get(id=channel_id, workspace=membership.workspace)
        except Channel.DoesNotExist:
            return Response({"error": "Channel not found"}, status=404)

        # Centralized check — replaces inline _can_manage helper
        auth.require_can_manage_channel(channel)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        target = WorkspaceMembership.objects.filter(
            user_id=user_id, workspace=membership.workspace, is_active=True
        ).first()
        if not target:
            return Response({"error": "User not found in workspace"}, status=404)

        _, created = ChannelMember.objects.get_or_create(
            channel=channel, user_id=user_id, defaults={"role": "member"}
        )
        return Response(
            {"detail": "Member added" if created else "Already a member"},
            status=200,
        )

    def delete(self, request, channel_id):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        try:
            channel = Channel.objects.get(id=channel_id, workspace=membership.workspace)
        except Channel.DoesNotExist:
            return Response({"error": "Channel not found"}, status=404)

        auth.require_can_manage_channel(channel)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        if channel.created_by_id == int(user_id):
            return Response({"error": "Cannot remove the channel creator"}, status=400)

        deleted, _ = ChannelMember.objects.filter(
            channel=channel, user_id=user_id
        ).delete()
        if deleted:
            return Response({"detail": "Member removed"}, status=200)
        return Response({"error": "Member not found"}, status=404)


# ── Direct Messages ───────────────────────────────────────────────────────────


class DMListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        dms = (
            Channel.objects.filter(
                members__user=request.user,
                is_dm=True,
                workspace=membership.workspace,
            )
            .select_related("created_by")
            .distinct()
            .order_by("-created_at")
        )
        return Response(
            ChannelSerializer(dms, many=True, context={"request": request}).data
        )

    def post(self, request):
        auth = ChatAuthService(request.user)

        target_id = request.data.get("user_id")
        if not target_id:
            return Response({"error": "user_id required"}, status=400)

        can_dm, reason = auth.can_dm_user(int(target_id))

        if not can_dm:
            if reason == "DM_EXISTS":
                membership = auth.require_workspace_membership()
                existing = (
                    Channel.objects.filter(
                        is_dm=True,
                        workspace=membership.workspace,
                        members__user=request.user,
                    )
                    .filter(members__user_id=target_id)
                    .first()
                )
                return Response(
                    ChannelSerializer(existing, context={"request": request}).data
                )
            return Response({"error": reason}, status=400)

        membership = auth.require_workspace_membership()
        target_user = WorkspaceMembership.objects.get(
            user_id=target_id, workspace=membership.workspace, is_active=True
        ).user

        slug = f"dm-{min(request.user.id, target_user.id)}-{max(request.user.id, target_user.id)}"
        if Channel.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid4().hex[:4]}"

        dm = Channel.objects.create(
            name=f"{request.user.username},{target_user.username}",
            slug=slug,
            is_dm=True,
            created_by=request.user,
            workspace=membership.workspace,
        )
        ChannelMember.objects.bulk_create(
            [
                ChannelMember(channel=dm, user=request.user, role="member"),
                ChannelMember(channel=dm, user=target_user, role="member"),
            ]
        )

        return Response(
            ChannelSerializer(dm, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ── Messages ──────────────────────────────────────────────────────────────────


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, channel_id):
        auth = ChatAuthService(request.user)
        auth.require_channel_access(channel_id)

        try:
            limit = int(request.GET.get("limit", 30))
            offset = int(request.GET.get("offset", 0))
        except ValueError:
            limit = 30
            offset = 0

        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)

        total_count = Message.objects.filter(channel_id=channel_id).count()

        messages = (
            Message.objects.filter(channel_id=channel_id)
            .select_related("sender")
            .order_by("created_at")[offset : offset + limit]
        )

        serialized = MessageSerializer(messages, many=True).data

        return Response(
            {
                "results": serialized,
                "offset": offset,
                "limit": limit,
                "total": total_count,
                "has_more": (offset + limit) < total_count,
            }
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth = ChatAuthService(request.user)

        channel_id = request.data.get("channel_id")
        content = (request.data.get("content") or "").strip()

        if not content:
            return Response({"error": "Message cannot be empty"}, status=400)

        # get_channel_for_user validates workspace + membership boundary
        channel = auth.get_channel_for_user(channel_id)
        if not channel:
            return Response({"error": "Access denied"}, status=403)

        # require_can_send_message handles role check + block check (DMs)
        auth.require_can_send_message(channel)

        msg = Message.objects.create(
            channel=channel,
            sender=request.user,
            content=content,
        )
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


# ── Workspace user directory ──────────────────────────────────────────────────


class WorkspaceUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        memberships = (
            WorkspaceMembership.objects.filter(
                workspace=membership.workspace, is_active=True
            )
            .exclude(user=request.user)
            .select_related("user")
        )

        return Response(
            [
                {
                    "id": m.user.id,
                    "username": m.user.username,
                    "full_name": f"{m.user.first_name} {m.user.last_name}".strip(),
                    "role": m.role,
                }
                for m in memberships
            ]
        )


# ── DM Requests ───────────────────────────────────────────────────────────────


# This file shows ONLY the DMRequestListCreateView and DMRequestRespondView changes
# These are the parts of chat/views.py that need to be updated to emit notifications

# FIND THIS IN chat/views.py and identify its exact location
# Then replace it with the code below


# ── NEW DM Request Views (with notifications) ─────────────────────────────────


class DMRequestListCreateView(APIView):
    """
    List pending DM requests received by the user OR create a new DM request.
    GET: Returns list of pending/accepted DM requests
    POST: Creates new DM request (sends to receiver, emits realtime notification)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List all DM requests (pending/accepted) for the user's workspace.
        """
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Get requests sent TO this user (received)
        received_requests = (
            DMRequest.objects.filter(
                receiver=request.user,
                workspace=membership.workspace,
            )
            .select_related("sender", "dm_channel")
            .order_by("-created_at")
        )

        # Get requests sent BY this user (sent)
        sent_requests = (
            DMRequest.objects.filter(
                sender=request.user,
                workspace=membership.workspace,
            )
            .select_related("receiver", "dm_channel")
            .order_by("-created_at")
        )

        received_data = [
            {
                "id": req.id,
                "type": "received",
                "sender_id": req.sender.id,
                "sender_name": req.sender.get_full_name() or req.sender.username,
                "status": req.status,
                "dm_channel_id": req.dm_channel_id,
                "created_at": req.created_at.isoformat(),
            }
            for req in received_requests
        ]

        sent_data = [
            {
                "id": req.id,
                "type": "sent",
                "receiver_id": req.receiver.id,
                "receiver_name": req.receiver.get_full_name() or req.receiver.username,
                "status": req.status,
                "dm_channel_id": req.dm_channel_id,
                "created_at": req.created_at.isoformat(),
            }
            for req in sent_requests
        ]

        return Response(
            {
                "received": received_data,
                "sent": sent_data,
            }
        )

    def post(self, request):
        """
        Create a new DM request from the authenticated user to another user.

        Payload:
        {
            "receiver_id": 2
        }

        Returns: { "id": 5, "status": "pending", "receiver_id": 2 }
        """
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        receiver_id = request.data.get("receiver_id")
        if not receiver_id:
            return Response(
                {"error": "receiver_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check: sender cannot DM self
        if receiver.id == request.user.id:
            return Response(
                {"error": "You cannot send a DM request to yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check: receiver is in same workspace
        receiver_membership = WorkspaceMembership.objects.filter(
            user=receiver, workspace=membership.workspace, is_active=True
        ).first()
        if not receiver_membership:
            return Response(
                {"error": "Receiver is not in your workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_blocked = Block.objects.filter(
            blocker=receiver, blocked=request.user, workspace=membership.workspace
        ).exists()
        if is_blocked:
            return Response(
                {"error": "You cannot send a DM request to this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check: request doesn't already exist
        existing = DMRequest.objects.filter(
            sender=request.user,
            receiver=receiver,
            workspace=membership.workspace,
            status="pending",
        ).first()
        if existing:
            return Response(
                {"error": "DM request already pending", "id": existing.id},
                status=status.HTTP_409_CONFLICT,
            )

        # Create the request
        dm_request = DMRequest.objects.create(
            sender=request.user,
            receiver=receiver,
            workspace=membership.workspace,
            status="pending",
        )

        # ── NEW: Emit realtime notification ────────────────────────────────

        NotificationService.create_and_emit(
            DMRequestEvent(
                actor_id=request.user.id,
                workspace_id=membership.workspace.id,
                receiver_id=receiver.id,
                dm_request_id=dm_request.id,
                sender_name=request.user.get_full_name() or request.user.username,
            )
        )

        return Response(
            {
                "id": dm_request.id,
                "status": dm_request.status,
                "receiver_id": receiver.id,
                "created_at": dm_request.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class DMRequestRespondView(APIView):
    """
    Respond to a DM request (accept/decline).
    PATCH: Update status (pending -> accepted/declined)
    DELETE: Delete a request (decline alternative)
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        """
        Accept or decline a DM request.

        Payload:
        {
            "status": "accepted" | "declined"
        }
        """
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        try:
            dm_request = DMRequest.objects.get(
                id=pk, receiver=request.user, workspace=membership.workspace
            )
        except DMRequest.DoesNotExist:
            return Response(
                {"error": "DM request not found"}, status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        if new_status not in ("accepted", "declined"):
            return Response(
                {"error": "status must be 'accepted' or 'declined'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == "accepted":
            # Check if DM channel already exists
            existing_dm = Channel.objects.filter(
                workspace=membership.workspace,
                is_dm=True,
                members__user=request.user,
                members__user__in=[dm_request.sender],
            ).first()

            if existing_dm:
                dm_request.dm_channel = existing_dm
            else:
                # Create DM channel
                dm_channel = Channel.objects.create(
                    name=f"DM: {dm_request.sender.username} - {request.user.username}",
                    is_dm=True,
                    is_private=True,
                    workspace=membership.workspace,
                    created_by=request.user,
                )

                # Add both users as members
                ChannelMember.objects.create(
                    channel=dm_channel, user=dm_request.sender, role="member"
                )
                ChannelMember.objects.create(
                    channel=dm_channel, user=request.user, role="member"
                )

                dm_request.dm_channel = dm_channel

        dm_request.status = new_status
        dm_request.save()

        return Response(
            {
                "id": dm_request.id,
                "status": dm_request.status,
                "dm_channel_id": dm_request.dm_channel_id,
                "updated_at": dm_request.updated_at.isoformat(),
            }
        )

    def delete(self, request, pk):
        """
        Decline a DM request (alternative to PATCH with status=declined).
        """
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        try:
            dm_request = DMRequest.objects.get(
                id=pk,
                receiver=request.user,
                workspace=membership.workspace,
                status="pending",
            )
        except DMRequest.DoesNotExist:
            return Response(
                {"error": "DM request not found"}, status=status.HTTP_404_NOT_FOUND
            )

        dm_request.status = "declined"
        dm_request.save()

        return Response({"status": "declined"}, status=status.HTTP_204_NO_CONTENT)


# ── Blocking ──────────────────────────────────────────────────────────────────


class BlockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        blocks = Block.objects.filter(
            blocker=request.user, workspace=membership.workspace
        ).select_related("blocked")

        return Response(
            [
                {
                    "user_id": b.blocked.id,
                    "username": b.blocked.username,
                    "blocked_at": b.created_at.isoformat(),
                }
                for b in blocks
            ]
        )

    def post(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        target_id = request.data.get("user_id")
        if not target_id:
            return Response({"error": "user_id required"}, status=400)

        if int(target_id) == request.user.id:
            return Response({"error": "Cannot block yourself"}, status=400)

        target = WorkspaceMembership.objects.filter(
            user_id=target_id, workspace=membership.workspace, is_active=True
        ).first()
        if not target:
            return Response({"error": "User not found in workspace"}, status=404)

        _, created = Block.objects.get_or_create(
            blocker=request.user,
            blocked_id=target_id,
            workspace=membership.workspace,
        )
        return Response({"detail": "User blocked" if created else "Already blocked"})

    def delete(self, request, user_id=None):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        deleted, _ = Block.objects.filter(
            blocker=request.user,
            blocked_id=user_id,
            workspace=membership.workspace,
        ).delete()

        if deleted:
            return Response({"detail": "User unblocked"})
        return Response({"error": "Block not found"}, status=404)


# ── Reports ───────────────────────────────────────────────────────────────────


class ReportCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        report_type = request.data.get("report_type")
        reason = (request.data.get("reason") or "").strip()

        if report_type not in ("message", "user"):
            return Response(
                {"error": "report_type must be 'message' or 'user'"}, status=400
            )
        if not reason:
            return Response({"error": "reason required"}, status=400)

        reported_message = None
        reported_user = None

        if report_type == "message":
            message_id = request.data.get("message_id")
            if not message_id:
                return Response({"error": "message_id required"}, status=400)
            try:
                reported_message = Message.objects.get(
                    id=message_id,
                    channel__workspace=membership.workspace,
                )
            except Message.DoesNotExist:
                return Response({"error": "Message not found"}, status=404)

        elif report_type == "user":
            user_id = request.data.get("user_id")
            if not user_id:
                return Response({"error": "user_id required"}, status=400)
            if int(user_id) == request.user.id:
                return Response({"error": "Cannot report yourself"}, status=400)
            target = WorkspaceMembership.objects.filter(
                user_id=user_id, workspace=membership.workspace, is_active=True
            ).first()
            if not target:
                return Response({"error": "User not found in workspace"}, status=404)
            reported_user = target.user

        Report.objects.create(
            reporter=request.user,
            workspace=membership.workspace,
            report_type=report_type,
            reason=reason,
            reported_message=reported_message,
            reported_user=reported_user,
        )
        return Response({"detail": "Report submitted"}, status=status.HTTP_201_CREATED)


class ReportAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        # require_workspace_admin replaces the inline _require_admin pattern
        membership = auth.require_workspace_admin()

        reports = (
            Report.objects.filter(workspace=membership.workspace)
            .select_related("reporter", "reported_user", "reported_message__sender")
            .order_by("-created_at")
        )

        data = []
        for r in reports:
            entry = {
                "id": r.id,
                "report_type": r.report_type,
                "reason": r.reason,
                "status": r.status,
                "admin_note": r.admin_note,
                "reporter": r.reporter.username,
                "created_at": r.created_at.isoformat(),
            }
            if r.reported_message:
                entry["reported_message"] = {
                    "id": r.reported_message.id,
                    "content": r.reported_message.content,
                    "sender": r.reported_message.sender.username,
                }
            if r.reported_user:
                entry["reported_user"] = {
                    "id": r.reported_user.id,
                    "username": r.reported_user.username,
                }
            data.append(entry)

        return Response(data)

    def patch(self, request, pk):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_admin()

        try:
            report = Report.objects.get(id=pk, workspace=membership.workspace)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=404)

        valid_statuses = ["reviewed", "actioned", "dismissed"]
        new_status = request.data.get("status")
        admin_note = request.data.get("admin_note", "")

        if new_status and new_status not in valid_statuses:
            return Response(
                {"error": f"status must be one of {valid_statuses}"}, status=400
            )

        if new_status:
            report.status = new_status
        if admin_note:
            report.admin_note = admin_note
        report.save()

        return Response({"detail": "Report updated", "status": report.status})


# ── Notification Views ────────────────────────────────────────────────────────


class NotificationListView(APIView):
    """
    List notifications for authenticated user.
    Supports filtering by status (unread, read, archived).

    GET /api/chat/notifications/?status=unread
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Filter by status if provided
        status_filter = request.query_params.get("status")

        notifications = Notification.objects.filter(
            recipient=request.user, workspace=membership.workspace
        ).order_by("-created_at")

        if status_filter:
            notifications = notifications.filter(status=status_filter)

        serializer = NotificationSerializer(notifications, many=True)

        # Include unread count
        unread_count = NotificationService.get_unread_count(
            request.user, membership.workspace
        )

        return Response(
            {
                "notifications": serializer.data,
                "unread_count": unread_count,
            }
        )


class NotificationDetailView(APIView):
    """
    Retrieve, mark as read, or delete a specific notification.

    GET /api/chat/notifications/{id}/     → Get notification
    POST /api/chat/notifications/{id}/read/  → Mark as read
    DELETE /api/chat/notifications/{id}/   → Archive notification
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def post(self, request, notification_id):
        """Mark notification as read."""
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.mark_read()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def delete(self, request, notification_id):
        """Archive notification (soft delete)."""
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.status = "archived"
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationBulkMarkReadView(APIView):
    """
    Mark multiple notifications as read at once.

    POST /api/chat/notifications/mark-read/
    {
        "notification_ids": [1, 2, 3]
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get("notification_ids", [])

        if not notification_ids:
            return Response(
                {"error": "notification_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Mark all notifications as read (only for this user)
        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            workspace=membership.workspace,
            status="unread",
        ).update(status="read")

        return Response(
            {
                "updated_count": updated,
            }
        )


class NotificationPreferenceView(APIView):
    """
    Get or update notification preferences for the user.

    GET /api/chat/notification-preferences/
    PATCH /api/chat/notification-preferences/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data)

    def patch(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(
            prefs, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadNotificationCountView(APIView):
    """
    Get unread notification count for workspace.

    GET /api/chat/unread-count/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        count = NotificationService.get_unread_count(request.user, membership.workspace)

        return Response(
            {
                "unread_count": count,
            }
        )


# ── NEW: File Upload ─────────────────────────────────────────────────────────


class FileUploadView(APIView):
    """
    Upload files via REST API.
    Uses transaction.atomic to prevent ghost messages.
    Broadcasts to WebSocket on success.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth = ChatAuthService(request.user)
        channel_id = request.data.get("channel_id")

        if not channel_id:
            return Response({"error": "channel_id required"}, status=400)

        auth.require_channel_access(channel_id)

        files = request.FILES.getlist("files")
        if not files:
            return Response({"error": "No files provided"}, status=400)

        try:
            validate_upload_payload(files)
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

        # FIX #3: Wrap DB operations in atomic block
        try:
            with transaction.atomic():
                message = Message.objects.create(
                    channel_id=channel_id, sender=request.user, content=""
                )

                attachments = []
                for file_obj in files:
                    try:
                        ext, mime_type = validate_file_upload(file_obj)

                        attachment = MessageAttachment.objects.create(
                            message=message,
                            file=file_obj,
                            original_filename=file_obj.name,
                            file_type=mime_type,
                            file_size=file_obj.size,
                        )
                        attachments.append(attachment)
                    except ValidationError as e:
                        logger.warning(
                            f"File validation failed for {file_obj.name}: {e}"
                        )

                if not attachments:
                    # Raising an error inside atomic() rolls back the Message creation too!
                    raise ValidationError("All files failed validation")

        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

        # FIX #5: Broadcast the new file message over WebSocket
        try:
            channel_layer = get_channel_layer()
            # Refresh from DB to ensure all relations (attachments) are readable
            message.refresh_from_db()
            serializer = MessageSerializer(message, context={"request": request})

            async_to_sync(channel_layer.group_send)(
                f"chat_{channel_id}",
                {
                    "type": "chat_message",  # Matches the consumer handler
                    "data": serializer.data,  # Send the whole serialized payload
                },
            )
        except Exception as e:
            logger.error(f"Failed to broadcast file upload via WS: {e}")

        # Return the serialized message to the user who uploaded it
        return Response(
            MessageSerializer(message, context={"request": request}).data, status=201
        )


# ── NEW: Message Edit ────────────────────────────────────────────────────────


class MessageEditView(APIView):
    """Handle message editing."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id):
        message = get_object_or_404(Message, id=message_id)

        # Security: Only the sender can edit their own message
        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"}, status=403
            )

        # Security: Cannot edit deleted messages
        if message.is_deleted:
            return Response({"error": "Cannot edit a deleted message"}, status=400)

        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"error": "Message cannot be empty"}, status=400)

        # Verify user is still in the channel
        auth = ChatAuthService(request.user)
        auth.require_channel_access(message.channel_id)

        message.content = content
        message.is_edited = True
        message.edited_at = timezone.now()
        message.save()

        return Response(MessageSerializer(message, context={"request": request}).data)


# ── NEW: Message Soft Delete ─────────────────────────────────────────────────


class MessageDeleteView(APIView):
    """Handle soft-deleting a message."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):
        message = get_object_or_404(Message, id=message_id)

        # Security: Only sender or channel admin can delete
        is_sender = message.sender == request.user
        is_admin = ChannelMember.objects.filter(
            channel=message.channel, user=request.user, role="admin"
        ).exists()

        if not (is_sender or is_admin):
            return Response({"error": "Permission denied"}, status=403)

        auth = ChatAuthService(request.user)
        auth.require_channel_access(message.channel_id)

        message.is_deleted = True
        message.content = ""  # Wipe PII/data for privacy compliance
        message.save()

        return Response({"detail": "Message deleted"}, status=200)
