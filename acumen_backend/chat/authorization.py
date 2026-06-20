# acumen_backend/chat/authorization.py
from __future__ import annotations

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response

from workspaces.models import WorkspaceMembership, TeamMembership


class AuthorizationError(PermissionDenied):
    pass


class WSCloseCodes:
    UNAUTHORIZED = 4001
    FORBIDDEN = 4003
    GONE = 4010


class ChatAuthService:
    def __init__(self, user: User, workspace=None):
        self._user = user
        self._workspace = workspace
        self._membership_cache: WorkspaceMembership | None = None
        self._membership_fetched = False

    def get_workspace_membership(self) -> WorkspaceMembership | None:
        if not self._membership_fetched:
            if self._workspace:
                self._membership_cache = (
                    WorkspaceMembership.objects.filter(
                        user=self._user, workspace=self._workspace, is_active=True
                    )
                    .select_related("workspace")
                    .first()
                )
            else:
                # Fallback for views not yet refactored to pass workspace explicitly
                self._membership_cache = (
                    WorkspaceMembership.objects.filter(user=self._user, is_active=True)
                    .select_related("workspace")
                    .first()
                )
            self._membership_fetched = True
        return self._membership_cache

    def require_workspace_membership(self) -> WorkspaceMembership:
        membership = self.get_workspace_membership()
        if not membership:
            raise AuthorizationError("No active workspace membership found.")
        return membership

    def get_channel_for_user(self, channel_id: int | str):
        from chat.models import Channel, ChannelMember

        membership = self.get_workspace_membership()
        if not membership:
            return None

        try:
            channel_id_int = int(channel_id)
        except (TypeError, ValueError):
            return None

        try:
            return Channel.objects.select_related("team").get(
                id=channel_id_int,
                workspace=membership.workspace,
                members__user=self._user,
            )
        except Channel.DoesNotExist:
            return None

    def require_channel_access(self, channel_id: int | str):
        channel = self.get_channel_for_user(channel_id)
        if not channel:
            raise AuthorizationError("Channel not found or you do not have access.")
        return channel

    def can_access_channel(self, channel_id: int | str) -> bool:
        return self.get_channel_for_user(channel_id) is not None

    def can_manage_channel(self, channel) -> bool:
        membership = self.get_workspace_membership()
        if not membership:
            return False

        if membership.role in ("owner", "admin"):
            return True

        if channel.team_id and channel.channel_type == "team":
            if TeamMembership.objects.filter(
                user=self._user, team_id=channel.team_id, is_active=True, is_leader=True
            ).exists():
                return True

        if channel.channel_type == "private_group" and channel.owner == self._user:
            return True

        return False

    def require_can_manage_channel(self, channel) -> None:
        if not self.can_manage_channel(channel):
            raise AuthorizationError(
                "You do not have permission to manage this channel."
            )

    def can_create_channel(self, channel_type: str = "official") -> bool:
        membership = self.get_workspace_membership()
        if not membership:
            return False

        if channel_type == "private_group":
            return True
        return membership.role in ("owner", "admin")

    def require_can_create_channel(
        self, channel_type: str = "official"
    ) -> WorkspaceMembership:
        membership = self.require_workspace_membership()
        if not self.can_create_channel(channel_type):
            if channel_type in ("official", "team"):
                raise AuthorizationError(
                    "Only owners and admins can create official or team channels."
                )
            raise AuthorizationError("You do not have permission to create channels.")
        return membership

    def can_send_messages(self) -> bool:
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.role != "guest"

    def require_can_send_message(self, channel) -> None:
        from chat.models import Block, ChannelMember, DMRequest, Message

        membership = self.require_workspace_membership()

        if membership.role == "guest":
            raise AuthorizationError("Guests cannot send messages.")
        if channel.is_pending:
            raise AuthorizationError(
                "This group is pending and cannot receive messages yet."
            )

        if not ChannelMember.objects.filter(
            channel=channel,
            user=self._user,
            is_active=True,
            channel__workspace=membership.workspace,
        ).exists():
            raise AuthorizationError("You are not an active member of this channel.")

        if channel.is_dm:
            # DM Request Restriction Logic (Moved from Consumer)
            pending_request = DMRequest.objects.filter(
                dm_channel=channel, status="pending"
            ).first()
            if pending_request and pending_request.sender_id == self._user.id:
                if (
                    Message.objects.filter(
                        channel=channel, sender_id=self._user.id
                    ).count()
                    >= 1
                ):
                    raise AuthorizationError("dm_request_pending")

            other_member_ids = (
                ChannelMember.objects.filter(channel=channel)
                .exclude(user=self._user)
                .values_list("user_id", flat=True)
            )
            is_blocked = Block.objects.filter(
                blocker_id__in=other_member_ids,
                blocked=self._user,
                workspace=membership.workspace,
            ).exists()
            if is_blocked:
                raise AuthorizationError(
                    "You cannot send messages to this conversation."
                )

    def require_active_channel_member(self, channel) -> None:
        from chat.models import ChannelMember

        membership = self.require_workspace_membership()
        if not ChannelMember.objects.filter(
            channel=channel,
            user=self._user,
            is_active=True,
            channel__workspace=membership.workspace,
        ).exists():
            raise AuthorizationError(
                "You no longer have active access to this channel."
            )

    def can_dm_user(self, target_id: int) -> tuple[bool, str]:
        from chat.models import Block, Channel

        if target_id == self._user.id:
            return False, "Cannot DM yourself."

        membership = self.get_workspace_membership()
        if not membership:
            return False, "No active workspace membership."

        target_membership = WorkspaceMembership.objects.filter(
            user_id=target_id, workspace=membership.workspace, is_active=True
        ).first()
        if not target_membership:
            return False, "User not found in workspace."

        is_blocked = Block.objects.filter(
            blocker_id=target_id, blocked=self._user, workspace=membership.workspace
        ).exists()
        if is_blocked:
            return False, "Unable to send DM request to this user."

        existing_dm = (
            Channel.objects.filter(
                is_dm=True,
                workspace=membership.workspace,
                members__user=self._user,
                members__is_active=True,
            )
            .filter(members__user_id=target_id)
            .distinct()
            .first()
        )
        if existing_dm:
            return False, "DM_EXISTS"

        return True, ""

    def is_workspace_admin(self) -> bool:
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.role in ("owner", "admin")

    def require_workspace_admin(self) -> WorkspaceMembership:
        membership = self.require_workspace_membership()
        if not self.is_workspace_admin():
            raise AuthorizationError("Admin access required.")
        return membership

    def has_permission(self, permission: str) -> bool:
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.can(permission)

    def require_permission(self, permission: str) -> WorkspaceMembership:
        membership = self.require_workspace_membership()
        if not membership.can(permission):
            raise AuthorizationError(
                f"Your role '{membership.role}' does not have '{permission}' permission."
            )
        return membership


class AsyncChatAuthService:
    @staticmethod
    @database_sync_to_async
    def check_channel_access(user, channel_id: str) -> tuple[bool, int | None]:
        from chat.models import Channel, ChannelMember

        if not user or isinstance(user, AnonymousUser):
            return False, WSCloseCodes.UNAUTHORIZED

        try:
            channel = Channel.objects.select_related("workspace").get(
                id=int(channel_id)
            )
        except (Channel.DoesNotExist, ValueError, TypeError):
            return False, WSCloseCodes.GONE

        membership = WorkspaceMembership.objects.filter(
            user=user, workspace=channel.workspace, is_active=True
        ).first()
        if not membership:
            return False, WSCloseCodes.FORBIDDEN

            # Step 3: user is an ACTIVE member of the channel
        # Inactive members can read history via REST, but cannot connect to WS for live messages
        is_member = ChannelMember.objects.filter(
            channel=channel,
            user=user,
            is_active=True,
        ).exists()

        if not is_member:
            # FIX: Owners and Admins can connect to Official and Team channels
            # even if they don't have an explicit ChannelMember row (e.g., legacy data).
            if membership.role in ("owner", "admin") and channel.channel_type in (
                "official",
                "team",
            ):
                return True, None

            return False, WSCloseCodes.FORBIDDEN

        return True, None

    @staticmethod
    @database_sync_to_async
    def check_can_send_message(user, channel_id: str) -> tuple[bool, str]:
        from chat.models import ChannelMember, Block, Channel, DMRequest, Message

        try:
            channel = Channel.objects.select_related("workspace").get(
                id=int(channel_id)
            )
            membership = WorkspaceMembership.objects.filter(
                user=user, workspace=channel.workspace, is_active=True
            ).first()

            if not membership or membership.role == "guest":
                return False, "send_not_permitted"
            if not ChannelMember.objects.filter(
                channel=channel, user=user, is_active=True
            ).exists():
                return False, "not_an_active_member"
            if channel.is_pending:
                return False, "group_is_pending"

            if channel.is_dm:
                pending_request = DMRequest.objects.filter(
                    dm_channel=channel, status="pending"
                ).first()
                if pending_request and pending_request.sender_id == user.id:
                    if (
                        Message.objects.filter(
                            channel=channel, sender_id=user.id
                        ).count()
                        >= 1
                    ):
                        return False, "dm_request_pending"

                other_ids = (
                    ChannelMember.objects.filter(channel=channel)
                    .exclude(user=user)
                    .values_list("user_id", flat=True)
                )
                if Block.objects.filter(
                    blocker_id__in=other_ids, blocked=user, workspace=channel.workspace
                ).exists():
                    return False, "blocked"

            return True, ""
        except Exception:
            return False, "error"
