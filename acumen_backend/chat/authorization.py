# chat/authorization.py
#
# CENTRALIZED AUTHORIZATION SERVICE
# ==================================
#
# WHY THIS FILE EXISTS
# --------------------
# Permission logic was previously scattered across:
#   - chat/views.py  (inline role checks, _can_manage helpers, _require_admin)
#   - workspaces/permissions.py  (DRF permission classes, require_permission decorator)
#   - chat/consumers.py  (check_membership — no workspace validation)
#
# Problems with that approach:
#   1. The same check (e.g. "is this user a manager of this channel's team?")
#      was reimplemented in multiple views with slightly different logic.
#   2. The WebSocket consumer only checked ChannelMember existence, not that
#      the channel belongs to a workspace the user is still active in.
#   3. No single place to audit "how does the system decide X can do Y?"
#
# HOW TO USE THIS MODULE
# ----------------------
# In synchronous DRF views:
#
#     from chat.authorization import ChatAuthService
#
#     auth = ChatAuthService(request.user)
#     membership = auth.require_workspace_membership()   # raises or returns
#     auth.require_can_send_message(channel)
#     auth.require_can_manage_channel(channel)
#
# In async WebSocket consumers (via database_sync_to_async):
#
#     from chat.authorization import AsyncChatAuthService
#
#     # returns (is_allowed: bool, close_code: int | None)
#     ok, code = await AsyncChatAuthService.check_channel_access(user, channel_id)
#
# SECURITY PHILOSOPHY
# -------------------
# Every public method in ChatAuthService either:
#   - Returns a value (membership, channel, etc.) and raises AuthorizationError
#     if the check fails, OR
#   - Returns a bool for non-raising callers.
#
# This means callers can NEVER accidentally skip the check — there is no path
# where you get access without going through this service.
#
# SCALABILITY NOTE
# ----------------
# All DB queries here are scoped to the user's active workspace membership.
# No query ever returns rows from other workspaces. Queries use select_related
# where the result will be used by the caller (avoids N+1 in views).
# The async variants use database_sync_to_async correctly.

from __future__ import annotations

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response

from workspaces.models import WorkspaceMembership, TeamMembership

# ── Sentinel exception ────────────────────────────────────────────────────────


class AuthorizationError(PermissionDenied):
    """
    Raised by ChatAuthService when a permission check fails.
    DRF catches PermissionDenied automatically and returns HTTP 403,
    so views do not need try/except — they just call require_* and return
    the normal response if all checks pass.
    """

    pass


# ── Workspace close codes for WebSocket ──────────────────────────────────────


class WSCloseCodes:
    UNAUTHORIZED = 4001  # No token / invalid JWT
    FORBIDDEN = 4003  # Valid user but no access to this channel
    GONE = 4010  # Channel no longer exists


# ── Sync service (used in DRF views) ─────────────────────────────────────────


class ChatAuthService:
    """
    Synchronous authorization service.

    Instantiated once per view invocation with the request.user.
    Caches the membership lookup so multiple checks in one request don't
    hit the DB multiple times.

    Usage pattern:
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()
        channel = auth.require_channel_access(channel_id)
        auth.require_can_send_message(channel)
    """

    def __init__(self, user: User):
        self._user = user
        self._membership_cache: WorkspaceMembership | None = None
        self._membership_fetched = False

    # ── Membership resolution ─────────────────────────────────────────────

    def get_workspace_membership(self) -> WorkspaceMembership | None:
        """
        Returns the user's active workspace membership, or None.
        Result is cached for the lifetime of this service instance.

        WHY .first() is acceptable here:
        The current data model has a unique_together on (workspace, user),
        and a single user is expected to be in one workspace at a time
        (the platform's current scope). When multi-workspace is introduced,
        this method will accept an explicit workspace_id parameter and the
        cache will key on it.
        """
        if not self._membership_fetched:
            self._membership_cache = (
                WorkspaceMembership.objects.filter(user=self._user, is_active=True)
                .select_related("workspace")
                .first()
            )
            self._membership_fetched = True
        return self._membership_cache

    def require_workspace_membership(self) -> WorkspaceMembership:
        """
        Returns the membership or raises AuthorizationError (→ HTTP 403).
        Use this at the start of any view that needs workspace context.
        """
        membership = self.get_workspace_membership()
        if not membership:
            raise AuthorizationError("No active workspace membership found.")
        return membership

    # ── Channel access ────────────────────────────────────────────────────

    def get_channel_for_user(self, channel_id: int | str):
        """
        Returns the Channel if the user is a member of it AND it belongs to
        their workspace. Returns None if either condition fails.

        WHY both checks:
        A user could be a ChannelMember row from a past workspace they left.
        Checking channel.workspace == membership.workspace closes that gap.
        """
        from chat.models import Channel, ChannelMember

        membership = self.get_workspace_membership()
        if not membership:
            return None

        try:
            channel_id_int = int(channel_id)
        except (TypeError, ValueError):
            return None

        try:
            # Single query: channel must exist in user's workspace AND
            # user must be a member. The members__user join handles both.
            return Channel.objects.select_related("team").get(
                id=channel_id_int,
                workspace=membership.workspace,
                members__user=self._user,
            )
        except Channel.DoesNotExist:
            return None

    def require_channel_access(self, channel_id: int | str):
        """
        Returns the Channel or raises AuthorizationError.
        Use when the view needs to work with the channel object afterward.
        """
        channel = self.get_channel_for_user(channel_id)
        if not channel:
            raise AuthorizationError("Channel not found or you do not have access.")
        return channel

    def can_access_channel(self, channel_id: int | str) -> bool:
        """Non-raising boolean variant."""
        return self.get_channel_for_user(channel_id) is not None

    # ── Channel management ────────────────────────────────────────────────

    def can_manage_channel(self, channel) -> bool:
        """
        Returns True if the user can add/remove members from the given channel.

        Rules:
          - owner/admin: can manage any channel in their workspace
          - manager: can only manage channels belonging to their own team
          - employee/guest: cannot manage any channel

        WHY managers are scoped to their team:
        A manager should control their team's communication space but should
        not be able to modify channels owned by other teams. This is the
        "team-leader scoped management" requirement from the project brief.
        """
        membership = self.get_workspace_membership()
        if not membership:
            return False

        if membership.role in ("owner", "admin"):
            return True

        if membership.role == "manager":
            team_membership = (
                TeamMembership.objects.filter(user=self._user, is_active=True)
                .select_related("team")
                .first()
            )
            if team_membership and channel.team_id == team_membership.team_id:
                return True

        # Team leaders can manage their team's official chat
        if channel.team_id and channel.channel_type == 'official':
            if TeamMembership.objects.filter(
                user=self._user, team_id=channel.team_id, is_active=True, is_leader=True
            ).exists():
                return True

        # Private group owners can manage their own groups
        if channel.channel_type == 'private_group' and channel.owner == self._user:
            return True

        return False

    def require_can_manage_channel(self, channel) -> None:
        """Raises AuthorizationError if user cannot manage the channel."""
        if not self.can_manage_channel(channel):
            raise AuthorizationError(
                "You do not have permission to manage this channel."
            )

    # ── Channel creation ──────────────────────────────────────────────────

    def can_create_channel(self, channel_type: str = "official") -> bool:
        """
        Returns True if the user's role permits creating the given channel type.
        - official/team: owner, admin, manager
        - private_group: any active workspace member (including employees)
        - dm: handled by DM request flow
        """
        membership = self.get_workspace_membership()
        if not membership:
            return False

        if channel_type == "private_group":
            return True  # Any workspace member can create private groups

        # Official and Team channels require owner/admin/manager
        return membership.role in ("owner", "admin", "manager")

    def require_can_create_channel(self, channel_type: str = "official") -> WorkspaceMembership:
        """Returns membership (caller needs it) or raises."""
        membership = self.require_workspace_membership()
        if not self.can_create_channel(channel_type):
            if channel_type in ("official", "team"):
                raise AuthorizationError("Only owners, admins, and managers can create official or team channels.")
            raise AuthorizationError("You do not have permission to create channels.")
        return membership

    # ── Messaging ────────────────────────────────────────────────────────

    def can_send_messages(self) -> bool:
        """Guests cannot send messages."""
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.role != "guest"

    def require_can_send_message(self, channel) -> None:
        """
        Full send-message authorization:
          1. User has send_messages permission (role check)
          2. User is a member of the channel in their workspace
          3. If DM: user has not been blocked by the other party

        WHY the block check lives here instead of in the view:
        The view should not need to know the details of "what prevents sending".
        The service encapsulates all reasons a send can be rejected.
        """
        from chat.models import Block, ChannelMember

        membership = self.require_workspace_membership()

        if membership.role == "guest":
            raise AuthorizationError("Guests cannot send messages.")

        # Pending groups cannot receive messages
        if channel.is_pending:
            raise AuthorizationError("This group is pending and cannot receive messages yet.")

        # Channel membership + workspace boundary + ACTIVE status check
        # is_active=False means they left/were removed: they can read history, but cannot send.
        if not ChannelMember.objects.filter(
            channel=channel,
            user=self._user,
            is_active=True,
            channel__workspace=membership.workspace,
        ).exists():
            raise AuthorizationError("You are not an active member of this channel.")

        # Block check — only relevant for DMs
        if channel.is_dm:
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


    # ── Active membership required (reactions, uploads, replies) ────────

    def require_active_channel_member(self, channel) -> None:
        """
        Requires the user is an ACTIVE member of the channel.
        Inactive (left/removed) members can read history but cannot
        react, upload, or reply.
        """
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

    # ── DM requests ───────────────────────────────────────────────────────

    def can_dm_user(self, target_id: int) -> tuple[bool, str]:
        """
        Returns (can_dm: bool, reason: str).
        Encapsulates all DM pre-conditions in one place.

        Checks (in order):
          1. Target is not self
          2. Both in same workspace
          3. Target has not blocked requester
          4. DM channel doesn't already exist
          (Pending request check is handled separately — it's not "can't DM"
           but "request already in flight".)
        """
        from chat.models import Block, Channel

        if target_id == self._user.id:
            return False, "Cannot DM yourself."

        membership = self.get_workspace_membership()
        if not membership:
            return False, "No active workspace membership."

        target_membership = WorkspaceMembership.objects.filter(
            user_id=target_id,
            workspace=membership.workspace,
            is_active=True,
        ).first()
        if not target_membership:
            return False, "User not found in workspace."

        is_blocked = Block.objects.filter(
            blocker_id=target_id,
            blocked=self._user,
            workspace=membership.workspace,
        ).exists()
        if is_blocked:
            # Generic message — do not reveal that a block exists
            return False, "Unable to send DM request to this user."

        existing_dm = (
            Channel.objects.filter(
                is_dm=True,
                workspace=membership.workspace,
                members__user=self._user,
                members__is_active=True,
            )
            .filter(
                members__user_id=target_id
            )
            .distinct()
            .first()
        )
        if existing_dm:
            return False, "DM_EXISTS"  # Sentinel — caller shows the channel

        return True, ""

    # ── Admin operations ──────────────────────────────────────────────────

    def is_workspace_admin(self) -> bool:
        """True if the user is an owner or admin of their workspace."""
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.role in ("owner", "admin")

    def require_workspace_admin(self) -> WorkspaceMembership:
        """Returns membership or raises AuthorizationError (→ HTTP 403)."""
        membership = self.require_workspace_membership()
        if not self.is_workspace_admin():
            raise AuthorizationError("Admin access required.")
        return membership

    # ── Generic permission check ──────────────────────────────────────────

    def has_permission(self, permission: str) -> bool:
        """
        Checks against ROLE_PERMISSIONS dict.
        Use for named permissions (e.g. "post_announcements", "view_analytics").
        """
        membership = self.get_workspace_membership()
        if not membership:
            return False
        return membership.can(permission)

    def require_permission(self, permission: str) -> WorkspaceMembership:
        """Returns membership or raises AuthorizationError."""
        membership = self.require_workspace_membership()
        if not membership.can(permission):
            raise AuthorizationError(
                f"Your role '{membership.role}' does not have '{permission}' permission."
            )
        return membership


# ── Async service (used in WebSocket consumers) ───────────────────────────────


class AsyncChatAuthService:
    """
    Async authorization helpers for Django Channels consumers.

    All methods are decorated with @database_sync_to_async so they can be
    awaited directly from async consumer methods.

    WHY separate from ChatAuthService:
    Async consumers cannot call synchronous ORM methods directly — they must
    use database_sync_to_async. Keeping the async variants here (rather than
    wrapping them inside each consumer) means:
      - The consumer stays clean (just: ok, code = await check_channel_access(...))
      - The DB query logic lives in one place
      - It's easier to add workspace validation without touching consumer code
    """

    @staticmethod
    @database_sync_to_async
    def check_channel_access(user, channel_id: str) -> tuple[bool, int | None]:
        """
        Full WebSocket channel access check.

        Returns (is_allowed: bool, ws_close_code: int | None).
        If is_allowed is False, ws_close_code is the code to send on close().

        Checks:
          1. User is not AnonymousUser  →  WSCloseCodes.UNAUTHORIZED
          2. User has an active workspace membership  →  WSCloseCodes.FORBIDDEN
          3. Channel exists in that workspace  →  WSCloseCodes.GONE
          4. User is a ChannelMember of that channel  →  WSCloseCodes.FORBIDDEN

        WHY check workspace membership AND ChannelMember:
        Checking only ChannelMember means a deactivated workspace member
        (is_active=False) could still connect via a stale ChannelMember row.
        The workspace membership check ensures they're still an active member.
        This is the "defense in depth" requirement from the project brief.
        """
        from chat.models import Channel, ChannelMember

        if not user or isinstance(user, AnonymousUser):
            return False, WSCloseCodes.UNAUTHORIZED

        # Step 1: active workspace membership
        membership = (
            WorkspaceMembership.objects.filter(user=user, is_active=True)
            .select_related("workspace")
            .first()
        )
        if not membership:
            return False, WSCloseCodes.FORBIDDEN

        # Step 2: channel exists in that workspace
        try:
            channel = Channel.objects.get(
                id=int(channel_id),
                workspace=membership.workspace,
            )
        except (Channel.DoesNotExist, ValueError, TypeError):
            return False, WSCloseCodes.GONE

        # Step 3: user is an ACTIVE member of the channel
        # Inactive members can read history via REST, but cannot connect to WS for live messages
        is_member = ChannelMember.objects.filter(
            channel=channel,
            user=user,
            is_active=True,
        ).exists()
        if not is_member:
            return False, WSCloseCodes.FORBIDDEN

        return True, None

    @staticmethod
    @database_sync_to_async
    def check_can_send_message(user, channel_id: str) -> tuple[bool, str]:
        """
        Per-message send check for the WebSocket receive path.

        Returns (is_allowed: bool, error_reason: str).
        Called on every message receive — must be fast.

        WHY we re-check on every message (not just connect):
        A user could be blocked AFTER connecting to the WebSocket.
        The connect-time membership check only runs once. If we don't
        re-check on send, a user could bypass a block by staying connected.

        For team channels (not DMs) this is essentially free (one EXISTS query).
        For DMs there is one additional EXISTS for the block check.
        """
        from chat.models import ChannelMember, Block, Channel

        try:
            membership = (
                WorkspaceMembership.objects.filter(user=user, is_active=True)
                .select_related("workspace")
                .first()
            )
            if not membership or membership.role == "guest":
                return False, "send_not_permitted"

            channel = Channel.objects.get(
                id=int(channel_id),
                workspace=membership.workspace,
            )

            if not ChannelMember.objects.filter(channel=channel, user=user, is_active=True).exists():
                return False, "not_an_active_member"

            # Pending groups cannot receive messages
            if channel.is_pending:
                return False, "group_is_pending"

            if channel.is_dm:
                other_ids = (
                    ChannelMember.objects.filter(channel=channel)
                    .exclude(user=user)
                    .values_list("user_id", flat=True)
                )
                if Block.objects.filter(
                    blocker_id__in=other_ids,
                    blocked=user,
                    workspace=membership.workspace,
                ).exists():
                    return False, "blocked"

            return True, ""

        except Exception:
            return False, "error"
