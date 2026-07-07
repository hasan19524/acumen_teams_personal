# chat/views.py

import logging
from uuid import uuid4
from workspaces.models import TeamType
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, Count
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
    HiddenMessage,
)
from .serializers import (
    ChannelSerializer,
    MessageSerializer,
    MessageAttachmentSerializer,
    ReactionSerializer,
    MessageReadSerializer,
)
from .authorization import ChatAuthService, AuthorizationError
from chat.services.chat_service import ChatService
from notifications.services import NotificationService, DMRequestEvent, ChatCreatedEvent
from .services.file_service import validate_upload_payload, validate_file_upload
from workspaces.models import Workspace, WorkspaceMembership, Team, TeamMembership
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


class ChannelListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        from django.db.models import Subquery, OuterRef, IntegerField, Count, Q
        from django.db.models.functions import Coalesce
        from chat.models import Message, MessageRead

        # Subqueries for last message
        last_msg_sq = Message.objects.filter(
            channel=OuterRef("pk"), is_deleted=False
        ).order_by("-created_at")
        # Subquery for unread count
        unread_sq = (
            Message.objects.filter(channel=OuterRef("pk"))
            .exclude(sender=request.user)
            .exclude(reads__user=request.user)
            .order_by()
            .values("channel")
            .annotate(c=Count("pk"))
            .values("c")
        )

        base_qs = (
            Channel.objects.filter(
                members__user=request.user,
                members__is_active=True,
                is_dm=False,
                workspace=membership.workspace,
            )
            .select_related("created_by", "team")
            .annotate(
                member_count=Count("members", filter=Q(members__is_active=True)),
                last_message_content=Subquery(last_msg_sq.values("content")[:1]),
                last_message_created=Subquery(last_msg_sq.values("created_at")[:1]),
                last_message_sender=Subquery(last_msg_sq.values("sender__username")[:1]),
                unread_count=Coalesce(
                    Subquery(unread_sq, output_field=IntegerField()), 0
                ),
            )
            .distinct()
        )

        from django.db.models import F
        from workspaces.models import TeamMembership, TeamType

        # ── SELF-HEALING: Ensure the "Unassigned" team chat channel exists ──
        unassigned_team = Team.objects.filter(workspace=membership.workspace, team_type=TeamType.UNASSIGNED).first()
        if unassigned_team:
            unassigned_chat, created = Channel.objects.get_or_create(
                slug=f"unassigned-{membership.workspace.id}",
                defaults={
                    "name": "Unassigned",
                    "channel_type": "official", # Changed to official system channel
                    "workspace": membership.workspace,
                    "team": unassigned_team,
                    "created_by": membership.workspace.owner
                }
            )
            # If we just created it, add ALL workspace members to this chat so they can see it
            if created:
                for ws_mem in membership.workspace.memberships.filter(is_active=True):
                    ChannelMember.objects.get_or_create(
                        channel=unassigned_chat,
                        user=ws_mem.user,
                        defaults={"role": "member", "is_active": True}
                    )

        # Get IDs of teams the user is actively a member of (including Unassigned)
        user_team_ids = TeamMembership.objects.filter(
            user=request.user, is_active=True
        ).values_list("team_id", flat=True)

        # FIX: Show Official channels, channels they are explicitly members of, 
        # AND channels belonging to teams they are a member of.
        channels = (
            Channel.objects.filter(workspace=membership.workspace, is_dm=False)
            .filter(
                Q(channel_type="official") |
                Q(members__user=request.user, members__is_active=True) |
                Q(team_id__in=user_team_ids, channel_type="team")
            )
            .select_related("created_by", "team")
            .annotate(
                member_count=Count("members", filter=Q(members__is_active=True)),
                last_message_content=Subquery(last_msg_sq.values("content")[:1]),
                last_message_created=Subquery(last_msg_sq.values("created_at")[:1]),
                last_message_sender=Subquery(last_msg_sq.values("sender__username")[:1]),
                unread_count=Coalesce(
                    Subquery(unread_sq, output_field=IntegerField()), 0
                ),
            )
            .distinct()
            .order_by(F("last_message_created").desc(nulls_last=True), "name")
        )

        serializer = ChannelSerializer(channels, many=True)
        return Response(serializer.data)

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)

        channel_type = request.data.get("channel_type", "official")
        if channel_type not in ("official", "team", "private_group"):
            return Response({"error": "Invalid channel_type."}, status=400)

        membership = auth.require_can_create_channel(channel_type)

        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Channel name required"}, status=400)

        team = None
        team_id = request.data.get("team_id")
        if team_id:
            team = get_object_or_404(Team, id=team_id, workspace=membership.workspace)

        channel = ChatService.create_channel(
            workspace=membership.workspace,
            creator=request.user,
            name=name,
            channel_type=channel_type,
            team=team,
        )

        # SLACK MODEL: Send pending invites instead of force-adding members
        if channel_type == "private_group":
            member_ids = request.data.get("member_ids", [])
            from workspaces.models import PrivateGroupInvite
            from datetime import timedelta
            expires_at = timezone.now() + timedelta(hours=24)
            for mid in member_ids:
                try:
                    target_user = User.objects.get(id=mid)
                    if target_user != request.user:
                        PrivateGroupInvite.objects.get_or_create(
                            channel=channel,
                            inviter=request.user,
                            invitee=target_user,
                            workspace=membership.workspace,
                            defaults={"status": "pending", "expires_at": expires_at}
                        )
                except User.DoesNotExist:
                    pass

        return Response(ChannelSerializer(channel).data, status=status.HTTP_201_CREATED)


class ChannelMemberManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        channel = get_object_or_404(
            Channel, id=channel_id, workspace=membership.workspace
        )
        auth.require_channel_access(channel_id)

        from .serializers import UserMiniSerializer
        from workspaces.models import WorkspaceMembership
        
        members = (
            ChannelMember.objects.filter(channel=channel, is_active=True)
            .select_related("user", "user__profile")
        )
        data = []
        for m in members:
            # SSOT FIX: Return the Workspace role instead of the Channel role
            ws_membership = WorkspaceMembership.objects.filter(
                user=m.user, workspace=channel.workspace, is_active=True
            ).first()
            ws_role = ws_membership.role if ws_membership else "member"
            
            data.append({
                "id": m.id,
                "user_id": m.user.id,
                "username": m.user.username,
                "full_name": m.user.get_full_name() or m.user.username,
                "role": ws_role,
                "profile_image": UserMiniSerializer(m.user, context={"request": request}).data.get("profile_image"),
            })
        return Response(data)

    def post(self, request, workspace_id, channel_id):
        # ... rest of the code
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        channel = get_object_or_404(
            Channel, id=channel_id, workspace=membership.workspace
        )
        auth.require_can_manage_channel(channel)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        target = WorkspaceMembership.objects.filter(
            user_id=user_id, workspace=membership.workspace, is_active=True
        ).first()
        if not target:
            return Response({"error": "User not found in workspace"}, status=404)

        ChatService.add_channel_member(channel, target.user)
        return Response({"detail": "Member added"}, status=200)

    def delete(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        channel = get_object_or_404(
            Channel, id=channel_id, workspace=membership.workspace
        )
        auth.require_can_manage_channel(channel)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        if channel.created_by_id == int(user_id):
            return Response({"error": "Cannot remove the channel creator"}, status=400)

        target = WorkspaceMembership.objects.filter(
            user_id=user_id, workspace=membership.workspace, is_active=True
        ).first()
        if not target:
            return Response({"error": "User not found in workspace"}, status=404)

        removed = ChatService.remove_channel_member(channel, target.user)
        if removed:
            return Response({"detail": "Member removed"}, status=200)
        return Response({"error": "Active member not found"}, status=404)


class DMListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        dms = (
            Channel.objects.filter(
                members__user=request.user,
                members__is_active=True,
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

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        if membership.role not in ("owner", "admin"):
            return Response(
                {"error": "Use the DM request flow to message this user."}, status=403
            )

        target_id = request.data.get("user_id")
        if not target_id:
            return Response({"error": "user_id required"}, status=400)

        can_dm, reason = auth.can_dm_user(int(target_id))
        if not can_dm:
            if reason == "DM_EXISTS":
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

        target_user = get_object_or_404(
            WorkspaceMembership,
            user_id=target_id,
            workspace=membership.workspace,
            is_active=True,
        ).user

        dm = ChatService.create_dm(
            workspace=membership.workspace, sender=request.user, receiver=target_user
        )
        return Response(
            ChannelSerializer(dm, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(channel_id)

        try:
            limit = int(request.GET.get("limit", 30))
            offset = int(request.GET.get("offset", 0))
        except ValueError:
            limit, offset = 30, 0

        limit, offset = min(max(limit, 1), 100), max(offset, 0)
        total_count = Message.objects.filter(channel_id=channel_id).count()
        
        # FIX: If 'latest=true' is passed, calculate the offset server-side
        # This allows the frontend to fetch the latest messages in a single request
        if request.GET.get("latest", "false").lower() == "true":
            offset = max(0, total_count - limit)

        # Exclude messages hidden by the requesting user ("Delete for Me")
        hidden_ids = HiddenMessage.objects.filter(user=request.user).values_list("message_id", flat=True)
        
        messages = (
            Message.objects.filter(channel_id=channel_id)
            .exclude(id__in=hidden_ids)
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

        return Response(
            {
                "results": MessageSerializer(
                    messages, 
                    many=True, 
                    context={"request": request}
                ).data,
                "offset": offset,
                "limit": limit,
                "total": total_count,
                "has_more": (offset + limit) < total_count,
            }
        )


from rest_framework.throttling import UserRateThrottle


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]  # Apply the 120/min global user limit

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)

        channel_id = request.data.get("channel_id")
        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"error": "Message cannot be empty"}, status=400)

        channel = auth.get_channel_for_user(channel_id)
        if not channel:
            return Response({"error": "Access denied"}, status=403)

        auth.require_can_send_message(channel)

        reply_to_id = request.data.get("reply_to_id")
        parent_message_id = None
        if (
            reply_to_id
            and Message.objects.filter(id=reply_to_id, channel=channel).exists()
        ):
            parent_message_id = reply_to_id

        msg = ChatService.save_message(
            channel=channel,
            sender=request.user,
            content=content,
            client_id=request.data.get("client_id"),
            parent_message_id=parent_message_id,
        )

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


from django.db.models import Exists, OuterRef

class WorkspaceUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        # FIX: Use ChannelMember to accurately check if an ACTIVE DM exists between the two users
        # If a user deletes/leaves a chat, is_active=False, so they should appear in search again.
        dm_exists_sq = ChannelMember.objects.filter(
            channel__is_dm=True,
            channel__workspace=workspace,
            user=request.user,
            is_active=True
        ).filter(
            channel__members__user_id=OuterRef("user_id"),
            channel__members__is_active=True
        ).values("id")[:1]

        # Check for ANY pending request between the two users (in either direction)
        req_sent_sq = DMRequest.objects.filter(
            sender=request.user,
            receiver=OuterRef("user_id"),
            workspace=workspace,
            status="pending"
        ).values("id")[:1]
        
        req_received_sq = DMRequest.objects.filter(
            sender=OuterRef("user_id"),
            receiver=request.user,
            workspace=workspace,
            status="pending"
        ).values("id")[:1]

        memberships = (
            WorkspaceMembership.objects.filter(
                workspace=membership.workspace, is_active=True
            )
            .exclude(user=request.user)
            .select_related("user")
            .annotate(
                has_dm=Exists(dm_exists_sq),
                pending_req_sent=Exists(req_sent_sq),
                pending_req_received=Exists(req_received_sq)
            )
        )
        
        from .serializers import UserMiniSerializer
        return Response(
            [
                {
                    **UserMiniSerializer(m.user, context={"request": request}).data,
                    "role": m.role,
                    "has_dm": m.has_dm,
                    "has_pending_request": m.pending_req_sent or m.pending_req_received
                }
                for m in memberships
            ]
        )


class DMRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        DMRequest.objects.filter(
            receiver=request.user,
            workspace=membership.workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        received_requests = (
            DMRequest.objects.filter(
                receiver=request.user, workspace=membership.workspace, status="pending"
            )
            .select_related("sender", "dm_channel")
            .order_by("-created_at")
        )
        sent_requests = (
            DMRequest.objects.filter(
                sender=request.user, workspace=membership.workspace
            )
            .select_related("receiver", "dm_channel")
            .order_by("-created_at")
        )

        received_data = [
            {
                "id": r.id,
                "type": "received",
                "sender_id": r.sender.id,
                "sender_name": r.sender.get_full_name() or r.sender.username,
                "status": r.status,
                "initial_message": r.initial_message,
                "dm_channel_id": r.dm_channel_id,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in received_requests
        ]
        sent_data = [
            {
                "id": r.id,
                "type": "sent",
                "receiver_id": r.receiver.id,
                "receiver_name": r.receiver.get_full_name() or r.receiver.username,
                "status": r.status,
                "dm_channel_id": r.dm_channel_id,
                "created_at": r.created_at.isoformat(),
            }
            for r in sent_requests
        ]

        return Response({"received": received_data, "sent": sent_data})

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        receiver_id = request.data.get("receiver_id")
        initial_message = (request.data.get("initial_message") or "").strip()
        if not receiver_id or not initial_message:
            return Response(
                {"error": "receiver_id and initial_message are required"}, status=400
            )

        receiver = get_object_or_404(User, id=receiver_id)
        if receiver.id == request.user.id:
            return Response({"error": "Cannot DM yourself"}, status=400)
        if Block.objects.filter(
            blocker=receiver, blocked=request.user, workspace=workspace
        ).exists():
            return Response(
                {"error": "Cannot send DM request to this user"}, status=403
            )

        try:
            dm_request = ChatService.create_dm_request(
                workspace, request.user, receiver, initial_message
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        NotificationService.create_and_emit(
            DMRequestEvent(
                actor_id=request.user.id,
                workspace_id=workspace.id,
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
            status=201,
        )


class DMRequestRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, workspace_id, pk):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        dm_request = get_object_or_404(
            DMRequest, id=pk, receiver=request.user, workspace=workspace
        )
        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"}, status=400
            )

        try:
            dm_request = ChatService.respond_to_dm_request(
                dm_request, request.user, new_status
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=400)

        NotificationService.create_and_emit(
            DMRequestEvent(
                actor_id=request.user.id,
                workspace_id=workspace.id,
                receiver_id=dm_request.sender_id,
                dm_request_id=dm_request.id,
                sender_name=request.user.get_full_name() or request.user.username,
            )
        )
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

    def delete(self, request, workspace_id, pk):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        dm_request = get_object_or_404(
            DMRequest,
            id=pk,
            receiver=request.user,
            workspace=workspace,
            status="pending",
        )
        try:
            ChatService.respond_to_dm_request(dm_request, request.user, "rejected")
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        return Response({"status": "rejected"}, status=200)


class DMRequestUndoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, pk):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        dm_request = get_object_or_404(
            DMRequest,
            id=pk,
            receiver=request.user,
            workspace=workspace,
            status="rejected",
        )
        now = timezone.now()
        if (
            dm_request.rejected_at
            and (now - dm_request.rejected_at).total_seconds() > 86400
        ):
            return Response({"error": "24-hour undo window has expired"}, status=400)

        dm_request = ChatService.undo_dm_request(dm_request)
        return Response(
            {
                "id": dm_request.id,
                "status": "pending",
                "expires_at": dm_request.expires_at.isoformat(),
            },
            status=200,
        )


class BlockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        blocks = Block.objects.filter(
            blocker=request.user, workspace=workspace
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

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        target_id = request.data.get("user_id")
        if not target_id:
            return Response({"error": "user_id required"}, status=400)
        if int(target_id) == request.user.id:
            return Response({"error": "Cannot block yourself"}, status=400)

        target = WorkspaceMembership.objects.filter(
            user_id=target_id, workspace=workspace, is_active=True
        ).first()
        if not target:
            return Response({"error": "User not found in workspace"}, status=404)

        created = ChatService.create_block(workspace, request.user, target_id)
        return Response({"detail": "User blocked" if created else "Already blocked"})

    def delete(self, request, workspace_id, user_id=None):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        removed = ChatService.remove_block(workspace, request.user, user_id)
        if removed:
            return Response({"detail": "User unblocked"})
        return Response({"error": "Block not found"}, status=404)


class ReportCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_membership()

        report_type = request.data.get("report_type")
        reason = (request.data.get("reason") or "").strip()
        if report_type not in ("message", "user"):
            return Response({"error": "Invalid report_type"}, status=400)
        if not reason:
            return Response({"error": "reason required"}, status=400)

        try:
            ChatService.create_report(workspace, request.user, request.data)
        except Exception as e:
            return Response({"error": str(e)}, status=404)
        return Response({"detail": "Report submitted"}, status=201)


class ReportAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_admin()

        reports = (
            Report.objects.filter(workspace=workspace)
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

    def patch(self, request, workspace_id, pk):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        membership = auth.require_workspace_admin()

        report = get_object_or_404(Report, id=pk, workspace=workspace)
        new_status = request.data.get("status")
        admin_note = request.data.get("admin_note", "")

        if new_status and new_status not in ["reviewed", "actioned", "dismissed"]:
            return Response({"error": "Invalid status"}, status=400)
        if new_status:
            report.status = new_status
        if admin_note:
            report.admin_note = admin_note
        report.save()
        return Response({"detail": "Report updated", "status": report.status})


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [
        UserRateThrottle
    ]  # Apply the 120/min global user limit to uploads

    def post(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)

        channel_id = request.data.get("channel_id")
        client_id = request.data.get("client_id")
        if not channel_id:
            return Response({"error": "channel_id required"}, status=400)

        channel = get_object_or_404(Channel, id=channel_id, workspace=workspace)
        auth.require_channel_access(channel_id)
        auth.require_active_channel_member(channel)

        if channel.is_pending:
            return Response({"error": "Group is pending"}, status=403)

        files = request.FILES.getlist("files")
        if not files:
            return Response({"error": "No files provided"}, status=400)
        try:
            validate_upload_payload(files)
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

        if client_id:
            existing_msg = Message.objects.filter(
                channel_id=channel_id, client_id=client_id
            ).first()
            if existing_msg:
                return Response(
                    MessageSerializer(existing_msg, context={"request": request}).data,
                    status=200,
                )

        try:
            message = ChatService.save_file_message(
                channel=channel, sender=request.user, files=files, client_id=client_id
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

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
            logger.error(f"Failed to broadcast file upload via WS: {e}", exc_info=True)
        return Response(serializer.data, status=201)


class MessageEditView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, workspace_id, message_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        message = get_object_or_404(
            Message, id=message_id, channel__workspace_id=workspace_id
        )

        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"}, status=403
            )
        if message.is_deleted:
            return Response({"error": "Cannot edit a deleted message"}, status=400)

        content = (request.data.get("content") or "").strip()
        if not content:
            return Response({"error": "Message cannot be empty"}, status=400)

        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(message.channel_id)

        ChatService.edit_message(message, content)

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


class MessageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, workspace_id, message_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        message = get_object_or_404(
            Message, id=message_id, channel__workspace_id=workspace_id
        )

        is_sender = message.sender == request.user
        is_admin = ChannelMember.objects.filter(
            channel=message.channel, user=request.user, role="admin", is_active=True
        ).exists()
        if not (is_sender or is_admin):
            return Response({"error": "Permission denied"}, status=403)

        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(message.channel_id)

        ChatService.soft_delete_message(message)

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


class ReactionToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, message_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        message = get_object_or_404(
            Message, id=message_id, channel__workspace_id=workspace_id
        )

        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(message.channel_id)
        auth.require_active_channel_member(message.channel)

        channel = get_object_or_404(Channel, id=message.channel_id)
        if channel.is_pending:
            return Response({"error": "Group is pending"}, status=403)

        emoji = request.data.get("emoji")
        if not emoji:
            return Response({"error": "emoji required"}, status=400)

        reaction, is_added = ChatService.toggle_reaction(message, request.user, emoji)
        channel_layer = get_channel_layer()
        channel_group = f"chat_{message.channel_id}"

        if not is_added:
            async_to_sync(channel_layer.group_send)(
                channel_group,
                {
                    "type": "chat_message",
                    "event": "reaction.removed",
                    "data": {
                        "message_id": message.id,
                        "emoji": emoji,
                        "user_id": request.user.id,
                        "channel": message.channel_id,
                    },
                },
            )
            return Response({"status": "removed"}, status=200)
        else:
            serializer = ReactionSerializer(reaction, context={"request": request})
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


class MessageHideView(APIView):
    """Persists a 'Delete for Me' action in the backend database."""
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, message_id):
        message = get_object_or_404(Message, id=message_id, channel__workspace_id=workspace_id)
        HiddenMessage.objects.get_or_create(user=request.user, message=message)
        return Response({"detail": "Message hidden successfully."}, status=status.HTTP_200_OK)


class MessageMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, message_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        message = get_object_or_404(
            Message, id=message_id, channel__workspace_id=workspace_id
        )

        if message.sender == request.user:
            return Response({"status": "ignored"}, status=200)

        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(message.channel_id)

        read, created = ChatService.mark_message_read(message, request.user)
        if created:
            serializer = MessageReadSerializer(read, context={"request": request})
            channel_layer = get_channel_layer()
            channel_group = f"chat_{message.channel_id}"
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

class MarkChannelReadView(APIView):
    """Marks all unread messages in a channel as read for the requesting user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(channel_id)

        # Find all unread messages in this channel
        unread_messages = Message.objects.filter(
            channel_id=channel_id
        ).exclude(sender=request.user).exclude(reads__user=request.user)

        # Bulk create read receipts
        reads_to_create = [
            MessageRead(message=msg, user=request.user)
            for msg in unread_messages
        ]
        if reads_to_create:
            MessageRead.objects.bulk_create(reads_to_create, ignore_conflicts=True)

        # Emit WS event to all of the user's connected clients to sync unread count to 0
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}",
            {
                "type": "chat_message",
                "event": "channel.read",
                "data": {"channel_id": channel_id}
            }
        )
        return Response({"detail": "Channel marked as read."}, status=200)
    
class ChannelClearView(APIView):
    """Clears all messages in a channel by soft-deleting them."""
    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        auth.require_channel_access(channel_id)
        
        # Soft delete all messages in this channel
        Message.objects.filter(channel_id=channel_id).update(
            is_deleted=True, content="", edited_at=timezone.now()
        )
        
        # Broadcast WS event to clear messages for everyone in the channel
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{channel_id}",
            {
                "type": "chat_message", 
                "event": "channel.cleared", 
                "data": {"channel_id": channel_id}
            }
        )
        return Response({"detail": "Chat cleared successfully."}, status=200)


class ChannelDeleteView(APIView):
    """
    'Deletes' a chat for the requesting user by setting their membership to inactive.
    This preserves the chat history for other members (like leaving a chat in Slack/WhatsApp).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, workspace_id, channel_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        auth = ChatAuthService(request.user, workspace=workspace)
        channel = get_object_or_404(Channel, id=channel_id, workspace=workspace)
        
        # Only allow deleting/leaving private groups or DMs
        if channel.channel_type not in ("dm", "private_group"):
            return Response({"error": "Cannot delete this channel type"}, status=403)
            
        # Remove the requesting user from the channel (they 'leave' it)
        ChannelMember.objects.filter(
            channel=channel, user=request.user, is_active=True
        ).update(is_active=False, left_at=timezone.now())
            
        return Response({"detail": "Chat deleted successfully."}, status=200)