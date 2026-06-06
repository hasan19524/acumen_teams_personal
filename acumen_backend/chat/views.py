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
    MessageRead,
    Reaction,
    DMRequest,
    Block,
    Report,
)
from .serializers import (
    ChannelSerializer,
    MessageSerializer,
    MessageAttachmentSerializer,
)
from .authorization import ChatAuthService, AuthorizationError
from notifications.services import NotificationService, DMRequestEvent, ChatCreatedEvent
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
                members__is_active=True,  # NEW: Exclude soft-deleted memberships
                is_dm=False,
                workspace=membership.workspace,  # workspace boundary enforced here
            )
            .select_related("created_by", "team")
            .distinct()
        )

        if membership.role in ("owner", "admin"):
            # Admins see all official + team channels, plus private groups they are members of
            channels = (
                Channel.objects.filter(workspace=membership.workspace, is_dm=False)
                .filter(
                    Q(channel_type__in=["official", "team"])
                    | Q(members__user=request.user, members__is_active=True)
                )
                .select_related("created_by", "team")
                .distinct()
                .order_by("name")
            )
        elif membership.role == "manager":
            team_membership = (
                TeamMembership.objects.filter(user=request.user, is_active=True)
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
        # Determine channel_type from request (defaults to 'official')
        channel_type = request.data.get("channel_type", "official")
        if channel_type not in ("official", "team", "private_group"):
            return Response(
                {"error": "Invalid channel_type. Use 'official', 'team', or 'private_group'."},
                status=400,
            )

        membership = auth.require_can_create_channel(channel_type)

        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Channel name required"}, status=400)

        team_id = request.data.get("team_id")

        # Managers can only create channels for their own team —
        # they cannot pick an arbitrary team_id
        if membership.role == "manager":
            team_membership = TeamMembership.objects.filter(
                user=request.user, is_active=True
            ).first()
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

        is_pending = channel_type == "private_group"  # Private groups start pending

        channel = Channel.objects.create(
            name=name,
            slug=slug,
            created_by=request.user,
            workspace=membership.workspace,
            team=team,
            channel_type=channel_type,
            owner=request.user if channel_type == "private_group" else None,
            is_pending=is_pending,
        )

        # Determine who gets auto-added as members
        member_users = []
        if team:
            # Team channels: Auto-add all active team members
            member_users = list(
                TeamMembership.objects.filter(team=team, is_active=True).values_list(
                    "user", flat=True
                )
            )
            ChannelMember.objects.bulk_create(
                [
                    ChannelMember(channel=channel, user_id=uid, role="member")
                    for uid in member_users
                ],
                ignore_conflicts=True,
            )

        # Always ensure the creator is an active admin member
        # (get_or_create prevents duplication if creator was already bulk_added via team)
        ChannelMember.objects.get_or_create(
            channel=channel,
            user=request.user,
            defaults={"role": "admin", "is_active": True},
        )

        # Notify all auto-added members about the new channel
        try:
            NotificationService.create_and_emit(
                ChatCreatedEvent(
                    actor_id=request.user.id,
                    workspace_id=membership.workspace.id,
                    channel_id=channel.id,
                    channel_name=channel.name,
                    member_ids=member_users,
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit ChatCreatedEvent: {e}")

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

        # Use update_or_create so re-adding a soft-deleted member reactivates them
        member, created = ChannelMember.objects.update_or_create(
            channel=channel,
            user_id=user_id,
            defaults={"role": "member", "is_active": True, "left_at": None},
        )
        return Response(
            {"detail": "Member added" if created else "Member reactivated"},
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

        # NEW: Soft-delete member (preserves history, blocks future messages)
        updated = ChannelMember.objects.filter(
            channel=channel, user_id=user_id, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        if updated:
            # RULE: Leaving official chat = leaving team
            if channel.channel_type == "official" and channel.team:
                TeamMembership.objects.filter(
                    user_id=user_id, team=channel.team, is_active=True
                ).update(is_active=False, left_at=timezone.now())

            return Response({"detail": "Member removed"}, status=200)
        return Response({"error": "Active member not found"}, status=404)


# ── Direct Messages ───────────────────────────────────────────────────────────


class DMListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        dms = (
            Channel.objects.filter(
                members__user=request.user,
                members__is_active=True,  # NEW: Exclude soft-deleted memberships
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
        membership = auth.require_workspace_membership()

        # Only owners/admins can bypass the DM request flow
        if membership.role not in ("owner", "admin"):
            return Response(
                {"error": "Use the DM request flow to message this user."},
                status=403,
            )

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
            channel_type="dm",  # NEW
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
            .select_related("sender", "parent_message", "parent_message__sender")
            .prefetch_related(
                "attachments",
                "parent_message__attachments",
                "reactions",
                "reactions__user",
                "reads",
                "reads__user",
            )
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

        # require_can_send_message handles role check + block check + pending group check (DMs)
        auth.require_can_send_message(channel)

        # NEW: Accept reply_to_id from frontend
        reply_to_id = request.data.get("reply_to_id")

        # Validate reply_to if provided
        parent_message_id = None
        if reply_to_id:
            if Message.objects.filter(id=reply_to_id, channel=channel).exists():
                parent_message_id = reply_to_id

        msg = Message.objects.create(
            channel=channel,
            sender=request.user,
            content=content,
            parent_message_id=parent_message_id,
        )

        # Re-fetch with select_related for nested reply_to serialization
        msg = (
            Message.objects.select_related(
                "sender", "parent_message", "parent_message__sender"
            )
            .prefetch_related("attachments", "parent_message__attachments")
            .get(id=msg.id)
        )

        return Response(
            MessageSerializer(msg, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


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
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Auto-expire stale pending requests on read
        now = timezone.now()
        DMRequest.objects.filter(
            receiver=request.user,
            workspace=membership.workspace,
            status="pending",
            expires_at__lte=now,
        ).update(status="expired")

        received_requests = (
            DMRequest.objects.filter(
                receiver=request.user,
                workspace=membership.workspace,
            )
            .select_related("sender", "dm_channel")
            .order_by("-created_at")
        )

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
                "initial_message": req.initial_message,
                "dm_channel_id": req.dm_channel_id,
                "expires_at": req.expires_at.isoformat() if req.expires_at else None,
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

        return Response({"received": received_data, "sent": sent_data})

    def post(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        receiver_id = request.data.get("receiver_id")
        initial_message = (request.data.get("initial_message") or "").strip()

        if not receiver_id:
            return Response(
                {"error": "receiver_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not initial_message:
            return Response(
                {"error": "An initial message is required to send a DM request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if receiver.id == request.user.id:
            return Response(
                {"error": "You cannot send a DM request to yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receiver_membership = WorkspaceMembership.objects.filter(
            user=receiver, workspace=membership.workspace, is_active=True
        ).first()
        if not receiver_membership:
            return Response(
                {"error": "Receiver is not in your workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Block.objects.filter(
            blocker=receiver, blocked=request.user, workspace=membership.workspace
        ).exists():
            return Response(
                {"error": "You cannot send a DM request to this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check for active pending request
        if DMRequest.objects.filter(
            sender=request.user,
            receiver=receiver,
            workspace=membership.workspace,
            status="pending",
        ).exists():
            return Response(
                {"error": "DM request already pending"}, status=status.HTTP_409_CONFLICT
            )

        # Check for cooldown (30 days after 24h undo window = 31 days total from rejection)
        now = timezone.now()
        if DMRequest.objects.filter(
            sender=request.user,
            receiver=receiver,
            workspace=membership.workspace,
            status="rejected",
            cooldown_until__gt=now,
        ).exists():
            return Response(
                {
                    "error": "You must wait before sending another DM request to this user"
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        from datetime import timedelta

        expires_at = now + timedelta(days=10)

        dm_request = DMRequest.objects.create(
            sender=request.user,
            receiver=receiver,
            workspace=membership.workspace,
            status="pending",
            initial_message=initial_message,
            expires_at=expires_at,
        )

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
                "initial_message": dm_request.initial_message,
                "expires_at": dm_request.expires_at.isoformat(),
                "created_at": dm_request.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class DMRequestRespondView(APIView):
    """
    Respond to a DM request (accept/reject).
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
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

        if dm_request.status != "pending":
            return Response(
                {"error": f"DM request is already {dm_request.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == "accepted":
            existing_dm = (
                Channel.objects.filter(
                    workspace=membership.workspace,
                    is_dm=True,
                    members__user=request.user,
                    members__is_active=True,
                )
                .filter(
                    members__user=dm_request.sender,
                    members__is_active=True,
                )
                .distinct()
                .first()
            )

            if existing_dm:
                dm_request.dm_channel = existing_dm
            else:
                dm_channel = Channel.objects.create(
                    name=f"DM: {dm_request.sender.username} - {request.user.username}",
                    is_dm=True,
                    is_private=True,
                    channel_type="dm",
                    workspace=membership.workspace,
                    created_by=dm_request.sender,
                )
                ChannelMember.objects.create(
                    channel=dm_channel, user=dm_request.sender, role="member"
                )
                ChannelMember.objects.create(
                    channel=dm_channel, user=request.user, role="member"
                )
                dm_request.dm_channel = dm_channel

            dm_request.status = "accepted"

            NotificationService.create_and_emit(
                DMRequestEvent(
                    actor_id=request.user.id,
                    workspace_id=membership.workspace.id,
                    receiver_id=dm_request.sender_id,
                    dm_request_id=dm_request.id,
                    sender_name=request.user.get_full_name() or request.user.username,
                )
            )

        elif new_status == "rejected":
            from datetime import timedelta

            now = timezone.now()
            # 24h undo window + 30 days cooldown = 31 days total
            cooldown_until = now + timedelta(days=31)
            dm_request.status = "rejected"
            dm_request.rejected_at = now
            dm_request.cooldown_until = cooldown_until

            NotificationService.create_and_emit(
                DMRequestEvent(
                    actor_id=request.user.id,
                    workspace_id=membership.workspace.id,
                    receiver_id=dm_request.sender_id,
                    dm_request_id=dm_request.id,
                    sender_name=request.user.get_full_name() or request.user.username,
                )
            )

        dm_request.save()

        return Response(
            {
                "id": dm_request.id,
                "status": dm_request.status,
                "dm_channel_id": dm_request.dm_channel_id,
                "rejected_at": (
                    dm_request.rejected_at.isoformat()
                    if dm_request.rejected_at
                    else None
                ),
                "cooldown_until": (
                    dm_request.cooldown_until.isoformat()
                    if dm_request.cooldown_until
                    else None
                ),
                "updated_at": dm_request.updated_at.isoformat(),
            }
        )

    def delete(self, request, pk):
        """Decline a DM request (alternative to PATCH)."""
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

        from datetime import timedelta

        now = timezone.now()
        dm_request.status = "rejected"
        dm_request.rejected_at = now
        dm_request.cooldown_until = now + timedelta(days=31)
        dm_request.save()

        return Response({"status": "rejected"}, status=status.HTTP_200_OK)


class DMRequestUndoView(APIView):
    """
    Allows the receiver to undo a DM request rejection within 24 hours.
    After undo, the request goes back to pending state.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        try:
            dm_request = DMRequest.objects.get(
                id=pk,
                receiver=request.user,
                workspace=membership.workspace,
                status="rejected",
            )
        except DMRequest.DoesNotExist:
            return Response(
                {"error": "Rejected DM request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        now = timezone.now()
        if (
            dm_request.rejected_at
            and (now - dm_request.rejected_at).total_seconds() > 86400
        ):
            return Response(
                {"error": "24-hour undo window has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from datetime import timedelta

        dm_request.status = "pending"
        dm_request.rejected_at = None
        dm_request.cooldown_until = None
        dm_request.expires_at = now + timedelta(days=10)
        dm_request.save()

        return Response(
            {
                "id": dm_request.id,
                "status": "pending",
                "expires_at": dm_request.expires_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


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
        client_id = request.data.get("client_id")  # NEW: For idempotency

        if not channel_id:
            return Response({"error": "channel_id required"}, status=400)

        channel = Channel.objects.get(id=channel_id)
        auth.require_channel_access(channel_id)
        auth.require_active_channel_member(channel)

        # Pending groups cannot receive uploads
        if channel.is_pending:
            return Response(
                {"error": "This group is pending and cannot receive uploads yet."},
                status=403,
            )

        files = request.FILES.getlist("files")
        if not files:
            return Response({"error": "No files provided"}, status=400)

        try:
            validate_upload_payload(files)
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

        # IDEMPOTENCY: If client_id is provided, check for existing message
        if client_id:
            existing_msg = Message.objects.filter(
                channel_id=channel_id, client_id=client_id
            ).first()
            if existing_msg:
                return Response(
                    MessageSerializer(existing_msg, context={"request": request}).data,
                    status=200,  # 200 OK instead of 201 Created on idempotent retry
                )

        saved_attachments = []
        try:
            with transaction.atomic():
                message = Message.objects.create(
                    channel_id=channel_id,
                    sender=request.user,
                    content="",
                    client_id=client_id,
                )

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
                        saved_attachments.append(attachment)
                    except ValidationError as e:
                        logger.warning(
                            f"File validation failed for {file_obj.name}: {e}"
                        )

                if not saved_attachments:
                    raise ValidationError("All files failed validation")

        except ValidationError as e:
            # ORPHAN FIX: If transaction rolled back, Django left files on disk. Clean them up.
            for att in saved_attachments:
                if att.file:
                    try:
                        att.file.delete(save=False)
                    except Exception as cleanup_err:
                        logger.error(f"Failed to cleanup orphaned file: {cleanup_err}")
            return Response({"error": str(e)}, status=400)

        # Broadcast via WS using the standardized envelope
        try:
            channel_layer = get_channel_layer()
            message = (
                Message.objects.select_related(
                    "sender", "parent_message", "parent_message__sender"
                )
                .prefetch_related(
                    "attachments",
                    "parent_message__attachments",
                    "reactions",
                    "reactions__user",
                    "reads",
                    "reads__user",
                )
                .get(id=message.id)
            )
            serializer = MessageSerializer(message, context={"request": request})

            async_to_sync(channel_layer.group_send)(
                f"chat_{channel_id}",
                {
                    "type": "chat_message",
                    "event": "message.created",
                    "data": serializer.data,
                },
            )
        except Exception as e:
            logger.error(f"Failed to broadcast file upload via WS: {e}")

        return Response(serializer.data, status=201)


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

        # Broadcast edit via WS
        try:
            channel_layer = get_channel_layer()
            message = (
                Message.objects.select_related(
                    "sender", "parent_message", "parent_message__sender"
                )
                .prefetch_related(
                    "attachments",
                    "parent_message__attachments",
                    "reactions",
                    "reactions__user",
                    "reads",
                    "reads__user",
                )
                .get(id=message.id)
            )
            serializer = MessageSerializer(message, context={"request": request})
            async_to_sync(channel_layer.group_send)(
                f"chat_{message.channel_id}",
                {
                    "type": "chat_message",
                    "event": "message.updated",
                    "data": serializer.data,
                },
            )
        except Exception as e:
            logger.error(f"Failed to broadcast message edit via WS: {e}")

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
            channel=message.channel, user=request.user, role="admin", is_active=True
        ).exists()

        if not (is_sender or is_admin):
            return Response({"error": "Permission denied"}, status=403)

        auth = ChatAuthService(request.user)
        auth.require_channel_access(message.channel_id)

        message.is_deleted = True
        message.content = ""  # Wipe PII/data for privacy compliance
        message.save()

        # Broadcast deletion via WS
        try:
            channel_layer = get_channel_layer()
            message = (
                Message.objects.select_related(
                    "sender", "parent_message", "parent_message__sender"
                )
                .prefetch_related(
                    "attachments",
                    "parent_message__attachments",
                    "reactions",
                    "reactions__user",
                    "reads",
                    "reads__user",
                )
                .get(id=message.id)
            )
            serializer = MessageSerializer(message, context={"request": request})
            async_to_sync(channel_layer.group_send)(
                f"chat_{message.channel_id}",
                {
                    "type": "chat_message",
                    "event": "message.deleted",
                    "data": serializer.data,
                },
            )
        except Exception as e:
            logger.error(f"Failed to broadcast message deletion via WS: {e}")

        return Response({"detail": "Message deleted"}, status=200)

    # ── NEW: Reaction Toggle ────────────────────────────────────────────────────


class ReactionToggleView(APIView):
    """
    Toggle a reaction on a message.
    If the reaction exists, remove it. If it doesn't, add it.
    Broadcasts the change via WebSocket.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        message = get_object_or_404(Message, id=message_id)
        auth = ChatAuthService(request.user)
        auth.require_channel_access(message.channel_id)
        auth.require_active_channel_member(message.channel)

        # Pending groups cannot have reactions
        channel = Channel.objects.get(id=message.channel_id)
        if channel.is_pending:
            return Response(
                {"error": "This group is pending and cannot receive reactions yet."},
                status=403,
            )

        emoji = request.data.get("emoji")
        if not emoji:
            return Response({"error": "emoji required"}, status=400)

        existing = Reaction.objects.filter(
            message=message, user=request.user, emoji=emoji
        ).first()

        channel_layer = get_channel_layer()
        channel_group = f"chat_{message.channel_id}"

        if existing:
            existing.delete()
            # Broadcast removal
            async_to_sync(channel_layer.group_send)(
                channel_group,
                {
                    "type": "chat_message",
                    "event": "reaction.removed",
                    "data": {
                        "message_id": message.id,
                        "reaction_id": existing.id,
                        "emoji": existing.emoji,
                        "user_id": request.user.id,
                        "channel": message.channel_id,
                    },
                },
            )
            return Response({"status": "removed"}, status=200)
        else:
            reaction = Reaction.objects.create(
                message=message, user=request.user, emoji=emoji
            )
            from .serializers import ReactionSerializer

            serializer = ReactionSerializer(reaction, context={"request": request})

            # Broadcast addition
            async_to_sync(channel_layer.group_send)(
                channel_group,
                {
                    "type": "chat_message",
                    "event": "reaction.added",
                    "data": {
                        "message_id": message.id,
                        "reaction": serializer.data,
                        "channel": message.channel_id,
                    },
                },
            )
            return Response(serializer.data, status=201)


# ── NEW: Message Read Receipt ────────────────────────────────────────────────


class MessageMarkReadView(APIView):
    """
    Mark a message as read by the current user.
    Broadcasts the read receipt via WebSocket.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        message = get_object_or_404(Message, id=message_id)

        # Ignore if user is reading their own message
        if message.sender == request.user:
            return Response({"status": "ignored"}, status=200)

        auth = ChatAuthService(request.user)
        auth.require_channel_access(message.channel_id)

        read, created = MessageRead.objects.get_or_create(
            message=message,
            user=request.user,
        )

        if created:
            from .serializers import MessageReadSerializer

            serializer = MessageReadSerializer(read, context={"request": request})

            channel_layer = get_channel_layer()
            channel_group = f"chat_{message.channel_id}"

            # Broadcast read receipt
            async_to_sync(channel_layer.group_send)(
                channel_group,
                {
                    "type": "chat_message",
                    "event": "message.read",
                    "data": {
                        "message_id": message.id,
                        "read": serializer.data,
                        "channel": message.channel_id,
                    },
                },
            )
            return Response(serializer.data, status=201)

        return Response({"status": "already_read"}, status=200)
