import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.utils import timezone

from notifications.models import Notification, NotificationPreference
from workspaces.models import Workspace

logger = logging.getLogger(__name__)


# ── Event Classes ──────────────────────────────────────────────────────────────


class NotificationEvent:
    """
    Typed event object. Standardizes all events with consistent structure.
    """

    event_type: str

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        timestamp: Optional[datetime] = None,
        **data,
    ):
        self.actor_id = actor_id
        self.workspace_id = workspace_id
        self.timestamp = timestamp or timezone.now()
        self.data = data

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to channel layer format."""
        return {
            "event_type": self.event_type,
            "actor_id": self.actor_id,
            "workspace_id": self.workspace_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
        }


class ChatCreatedEvent(NotificationEvent):
    """A new channel was created in the workspace."""

    event_type = "chat_created"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        channel_id: int,
        channel_name: str,
        member_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            channel_id=channel_id,
            channel_name=channel_name,
            member_ids=member_ids,
            **kwargs,
        )


class ChannelJoinedEvent(NotificationEvent):
    """A user joined a channel."""

    event_type = "channel_joined"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        channel_id: int,
        channel_name: str,
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            channel_id=channel_id,
            channel_name=channel_name,
            **kwargs,
        )


class MessageReceivedEvent(NotificationEvent):
    """A message was received in a channel (for offline/not-viewing users)."""

    event_type = "message_received"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        channel_id: int,
        channel_name: str,
        message_id: int,
        message_preview: str,
        recipient_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            channel_id=channel_id,
            channel_name=channel_name,
            message_id=message_id,
            message_preview=message_preview,
            recipient_ids=recipient_ids,
            **kwargs,
        )


class MentionEvent(NotificationEvent):
    """A user was @mentioned in a message."""

    event_type = "mention"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        channel_id: int,
        channel_name: str,
        message_id: int,
        mentioned_user_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            channel_id=channel_id,
            channel_name=channel_name,
            message_id=message_id,
            mentioned_user_ids=mentioned_user_ids,
            **kwargs,
        )


class TaskAssignedEvent(NotificationEvent):
    """A task was assigned to user(s)."""

    event_type = "task_assigned"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        task_id: int,
        task_title: str,
        assignee_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            task_id=task_id,
            task_title=task_title,
            assignee_ids=assignee_ids,
            **kwargs,
        )


class AnnouncementEvent(NotificationEvent):
    """An announcement was posted in the workspace."""

    event_type = "announcement"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        announcement_id: int,
        announcement_title: str,
        recipient_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            announcement_id=announcement_id,
            announcement_title=announcement_title,
            recipient_ids=recipient_ids,
            **kwargs,
        )


class WorkspaceEvent(NotificationEvent):
    """A workspace-level event (member added, role changed, etc)."""

    event_type = "workspace_event"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        event_description: str,
        member_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            event_description=event_description,
            member_ids=member_ids,
            **kwargs,
        )


class DMRequestEvent(NotificationEvent):
    """DM request sent from sender to receiver."""

    event_type = "dm_request"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        receiver_id: int,
        dm_request_id: int,
        sender_name: str,
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            receiver_id=receiver_id,
            dm_request_id=dm_request_id,
            sender_name=sender_name,
            **kwargs,
        )

class TaskCompletedEvent(NotificationEvent):
    """A task was marked as completed."""

    event_type = "task_completed"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        task_id: int,
        task_title: str,
        assignee_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            task_id=task_id,
            task_title=task_title,
            assignee_ids=assignee_ids,
            **kwargs,
        )


class TaskCommentedEvent(NotificationEvent):
    """A comment was added to a task."""

    event_type = "task_commented"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        task_id: int,
        task_title: str,
        comment_preview: str,
        assignee_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            task_id=task_id,
            task_title=task_title,
            comment_preview=comment_preview,
            assignee_ids=assignee_ids,
            **kwargs,
        )


class TeamInviteEvent(NotificationEvent):
    """A user was invited to a team."""

    event_type = "team_invite"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        team_id: int,
        team_name: str,
        invited_user_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            team_id=team_id,
            team_name=team_name,
            invited_user_ids=invited_user_ids,
            **kwargs,
        )


class WorkspaceInviteEvent(NotificationEvent):
    """A user was invited to the workspace."""

    event_type = "workspace_invite"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        invited_user_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            invited_user_ids=invited_user_ids,
            **kwargs,
        )


class AttendanceApprovalEvent(NotificationEvent):
    """Attendance needs approval from manager."""

    event_type = "attendance_approval"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        attendance_id: int,
        employee_name: str,
        manager_ids: List[int],
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            attendance_id=attendance_id,
            employee_name=employee_name,
            manager_ids=manager_ids,
            **kwargs,
        )


class RoleChangedEvent(NotificationEvent):
    """A user's role was changed in workspace/team."""

    event_type = "role_changed"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        user_id: int,
        old_role: str,
        new_role: str,
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            user_id=user_id,
            old_role=old_role,
            new_role=new_role,
            **kwargs,
        )


class MemberRemovedEvent(NotificationEvent):
    """A member was removed from workspace/team."""

    event_type = "member_removed"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        removed_user_id: int,
        removed_user_name: str,
        scope: str,
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            removed_user_id=removed_user_id,
            removed_user_name=removed_user_name,
            scope=scope,
            **kwargs,
        )


class DMRequestRejectedEvent(NotificationEvent):
    """DM request was rejected (for undo notification)."""

    event_type = "dm_request_rejected"

    def __init__(
        self,
        actor_id: int,
        workspace_id: int,
        receiver_id: int,
        dm_request_id: int,
        sender_name: str,
        rejected_at: str,
        **kwargs,
    ):
        super().__init__(
            actor_id=actor_id,
            workspace_id=workspace_id,
            receiver_id=receiver_id,
            dm_request_id=dm_request_id,
            sender_name=sender_name,
            rejected_at=rejected_at,
            **kwargs,
        )



# ── Service ────────────────────────────────────────────────────────────────────


class NotificationService:
    """
    Centralized service for creating, persisting, and emitting notifications.
    """

    _RECIPIENT_FIELD_MAP = {
        "chat_created": "member_ids",
        "channel_joined": "member_ids",
        "message_received": "recipient_ids",
        "mention": "mentioned_user_ids",
        "task_assigned": "assignee_ids",
        "task_completed": "assignee_ids",
        "task_commented": "assignee_ids",
        "announcement": "recipient_ids",
        "workspace_event": "member_ids",
        "channel_invite": "member_ids",
        "team_invite": "invited_user_ids",
        "workspace_invite": "invited_user_ids",
        "attendance_approval": "manager_ids",
        "role_changed": "user_id",
        "member_removed": "removed_user_id",
        "dm_request_rejected": "receiver_id",
    }

    @staticmethod
    def create_and_emit(event: NotificationEvent) -> Optional[int]:
        try:
            actor = User.objects.get(id=event.actor_id)
            workspace = Workspace.objects.get(id=event.workspace_id)
            recipients = NotificationService._get_recipients(event, workspace)

            notifications_to_create = []
            valid_recipients = []

            for recipient in recipients:
                if not NotificationService._check_preferences(recipient, event):
                    continue

                # FLOOD PROTECTION: For chat messages, aggregate instead of creating duplicates
                if event.event_type in ["message_received", "mention"]:
                    from django.utils import timezone
                    from datetime import timedelta
                    
                    five_min_ago = timezone.now() - timedelta(minutes=5)
                    recent = Notification.objects.filter(
                        recipient=recipient,
                        workspace=workspace,
                        notification_type=event.event_type,
                        status="unread",
                        created_at__gte=five_min_ago,
                    )
                    
                    # If same channel/conversation, update existing notification
                    channel_id = event.data.get("channel_id")
                    if channel_id and recent.exists():
                        existing = recent.filter(
                            metadata__channel_id=channel_id
                        ).first()
                        if existing:
                            # Increment message count in metadata
                            existing.metadata["message_count"] = existing.metadata.get("message_count", 1) + 1
                            existing.metadata["latest_preview"] = event.data.get("message_preview", "")
                            existing.save(update_fields=["metadata"])
                            valid_recipients.append(recipient)
                            continue
                
                # Create new notification if no recent aggregate found
                notifications_to_create.append(
                    Notification(
                        recipient=recipient,
                        workspace=workspace,
                        notification_type=event.event_type,
                        actor=actor,
                        title=NotificationService._get_title(event, recipient),
                        description=NotificationService._get_description(event),
                        status="unread",
                        related_object_id=NotificationService._get_related_object_id(event),
                        metadata=event.data,
                    )
                )
                valid_recipients.append(recipient)

            if not notifications_to_create:
                return None

            # PERFORMANCE: Bulk create notifications in a single query
            created_notifications = Notification.objects.bulk_create(notifications_to_create)
            notification_ids = [n.id for n in created_notifications]

            NotificationService._emit_async(event, notification_ids, valid_recipients)

            return notification_ids[0] if notification_ids else None

        except Exception as e:
            logger.exception(f"NotificationService.create_and_emit failed: {e}")
            return None

    @staticmethod
    def _get_recipients(event: NotificationEvent, workspace: Workspace) -> List[User]:
        """Resolve recipient users for any event type."""
        field_name = NotificationService._RECIPIENT_FIELD_MAP.get(event.event_type)

        # Special: dm_request uses receiver_id (single user)
        if event.event_type == "dm_request":
            receiver_id = event.data.get("receiver_id")
            if receiver_id:
                try:
                    return [User.objects.get(id=receiver_id)]
                except User.DoesNotExist:
                    return []
            return []

        # Special: channel_joined notifies all ACTIVE workspace members
        if event.event_type == "channel_joined":
            return list(
                User.objects.filter(
                    memberships__workspace=workspace,
                    memberships__is_active=True
                )
            )

        # Generic: look up user IDs from the mapped field
        if field_name:
            user_ids = event.data.get(field_name, [])
            if user_ids:
                return list(User.objects.filter(id__in=user_ids))

        return []

    @staticmethod
    def _get_related_object_id(event: NotificationEvent) -> Optional[int]:
        """Extract the primary related object ID for the notification."""
        id_fields = [
            "channel_id",
            "message_id",
            "task_id",
            "announcement_id",
            "dm_request_id",
        ]
        for field in id_fields:
            val = event.data.get(field)
            if val is not None:
                return int(val)
        return None

    @staticmethod
    def _check_preferences(user: User, event: NotificationEvent) -> bool:
        """Check if the user wants to receive this notification type."""
        try:
            prefs = user.notification_preferences
        except NotificationPreference.DoesNotExist:
            return True

        if prefs.all_notifications_muted:
            return False

        pref_map = {
            "chat_created": prefs.chat_created_enabled,
            "channel_joined": prefs.channel_joined_enabled,
            "message_received": prefs.message_received_enabled,
            "mention": prefs.mentions_enabled,
            "task_assigned": prefs.task_assignments_enabled,
            "announcement": prefs.announcements_enabled,
            "workspace_event": prefs.workspace_events_enabled,
            "dm_request": prefs.dm_requests_enabled,
            "channel_invite": prefs.channel_invites_enabled,
        }

        enabled = pref_map.get(event.event_type)
        if enabled is None:
            return True  # Unknown types pass through
        return enabled

    @staticmethod
    def _get_title(event: NotificationEvent, recipient: User) -> str:
        """Generate a human-readable title for the notification."""
        actor_name = event.data.get("sender_name", "")
        if not actor_name:
            try:
                actor_name = (
                    User.objects.get(id=event.actor_id).get_full_name()
                    or User.objects.get(id=event.actor_id).username
                )
            except User.DoesNotExist:
                actor_name = "Someone"

        titles = {
            "chat_created": f"{actor_name} created #{event.data.get('channel_name', 'channel')}",
            "channel_joined": f"{actor_name} joined #{event.data.get('channel_name', 'channel')}",
            "message_received": f"{actor_name} in #{event.data.get('channel_name', 'channel')}",
            "mention": f"{actor_name} mentioned you in #{event.data.get('channel_name', 'channel')}",
            "task_assigned": f"{actor_name} assigned you a task",
            "task_completed": f"Task completed: {event.data.get('task_title', 'untitled')}",
            "task_commented": f"{actor_name} commented on {event.data.get('task_title', 'a task')}",
            "announcement": f"{actor_name} posted an announcement",
            "workspace_event": event.data.get("event_description", "Workspace update"),
            "dm_request": f"{actor_name} sent you a DM request",
            "dm_request_rejected": f"DM request rejected by {actor_name}",
            "team_invite": f"{actor_name} invited you to #{event.data.get('team_name', 'team')}",
            "workspace_invite": f"{actor_name} invited you to the workspace",
            "attendance_approval": f"Attendance approval needed for {event.data.get('employee_name', 'employee')}",
            "role_changed": f"Your role changed to {event.data.get('new_role', 'member')}",
            "member_removed": f"{actor_name} removed {event.data.get('removed_user_name', 'a member')}",
        }
        return titles.get(event.event_type, f"Notification: {event.event_type}")

    @staticmethod
    def _get_description(event: NotificationEvent) -> str:
        """Generate a short description/preview for the notification."""
        descriptions = {
            "chat_created": "You've been added to a new channel",
            "channel_joined": "A new member joined the channel",
            "message_received": event.data.get("message_preview", ""),
            "mention": event.data.get("message_preview", "You were mentioned"),
            "task_assigned": event.data.get("task_title", "New task assigned"),
            "task_completed": event.data.get("task_title", "Task has been completed"),
            "task_commented": event.data.get("comment_preview", "New comment on your task"),
            "announcement": event.data.get("announcement_title", "New announcement"),
            "workspace_event": event.data.get("event_description", ""),
            "dm_request": "Tap to view and respond",
            "dm_request_rejected": "Your DM request was declined",
            "team_invite": f"Join the team #{event.data.get('team_name', 'team')}",
            "workspace_invite": "You've been invited to join the workspace",
            "attendance_approval": "Review and approve attendance record",
            "role_changed": f"Your new role: {event.data.get('new_role', 'member')}",
            "member_removed": f"Member was removed from {event.data.get('scope', 'workspace')}",
        }
        return descriptions.get(event.event_type, "")

    @staticmethod
    def _emit_async(
        event: NotificationEvent,
        notification_ids: List[int],
        recipients: List[User],
    ) -> None:
        """Emit WS events to all recipients' notification groups."""
        try:
            import asyncio

            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(
                    AsyncNotificationService._emit_to_groups(
                        event, notification_ids, recipients
                    )
                )
            else:
                asyncio.run(
                    AsyncNotificationService._emit_to_groups(
                        event, notification_ids, recipients
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to emit async notification: {e}")

    @staticmethod
    def mark_notification_read(notification_id: int) -> bool:
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.mark_read()
            return True
        except Notification.DoesNotExist:
            return False

    @staticmethod
    def mark_notifications_read_bulk(user: User, notification_ids: List[int]) -> int:
        """Bulk mark notifications as read. Returns count updated."""
        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=user,
            status="unread",
        ).update(status="read", read_at=timezone.now())
        return updated

    @staticmethod
    def get_unread_count(user: User, workspace: Optional[Workspace] = None) -> int:
        query = Notification.objects.filter(recipient=user, status="unread")
        if workspace:
            query = query.filter(workspace=workspace)
        return query.count()


# ── Async Service ──────────────────────────────────────────────────────────────


class AsyncNotificationService:
    """
    Async variants of notification service.
    """

    @staticmethod
    async def create_and_emit(event: NotificationEvent) -> Optional[int]:
        return await database_sync_to_async(NotificationService.create_and_emit)(event)

    @staticmethod
    async def _emit_to_groups(
        event: NotificationEvent,
        notification_ids: List[int],
        recipients: List[User],
    ) -> None:
        """Emit to every recipient's personal notification group."""
        channel_layer = get_channel_layer()

        for idx, recipient in enumerate(recipients):
            # Skip the actor
            if recipient.id == event.actor_id:
                continue

            notification_id = (
                notification_ids[idx] if idx < len(notification_ids) else None
            )
            group_name = f"notifications_{recipient.id}"

            try:
                await channel_layer.group_send(
                    group_name,
                    {
                        "type": "notification_event",
                        "event": event.to_dict(),
                        "notification_id": notification_id,
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to emit to group {group_name}: {e}")

    @staticmethod
    async def mark_notification_read(notification_id: int) -> bool:
        return await database_sync_to_async(NotificationService.mark_notification_read)(
            notification_id
        )

    @staticmethod
    async def get_unread_count(
        user: User, workspace: Optional[Workspace] = None
    ) -> int:
        return await database_sync_to_async(NotificationService.get_unread_count)(
            user, workspace
        )
