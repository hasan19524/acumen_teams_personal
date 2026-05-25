# chat/notifications.py
# NEW FILE: Core notification service for event emission and persistence

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.utils import timezone

from workspaces.models import Workspace

logger = logging.getLogger(__name__)


class NotificationEvent:
    """
    Typed event object. Standardizes all events with consistent structure.
    Subclass for each event type to enforce required fields.
    """

    event_type: str  # Override in subclass: "dm_request", "mention", etc.

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


class NotificationService:
    """
    Centralized service for creating, persisting, and emitting notifications.

    Responsibilities:
    1. Create Notification DB records (persistent)
    2. Emit events to WebSocket groups (realtime)
    3. Filter by user preferences
    4. Support both sync and async contexts

    Usage (sync context):
        NotificationService.create_and_emit(
            DMRequestEvent(actor_id=1, workspace_id=5, receiver_id=2, ...)
        )

    Usage (async context):
        await AsyncNotificationService.create_and_emit(event)
    """

    @staticmethod
    def create_and_emit(event: NotificationEvent) -> Optional[int]:
        """
        Synchronous: Create persistent notification and emit realtime event.
        Returns notification ID on success, None on failure.
        """
        from chat.models import Notification

        try:
            # Get actor and workspace objects
            actor = User.objects.get(id=event.actor_id)
            workspace = Workspace.objects.get(id=event.workspace_id)

            # Determine recipient(s) based on event type
            recipients = NotificationService._get_recipients(event)

            notification_ids = []
            for recipient in recipients:
                # Check user preferences
                if not NotificationService._check_preferences(recipient, event):
                    continue

                # Create persistent notification
                notification = Notification.objects.create(
                    recipient=recipient,
                    workspace=workspace,
                    notification_type=event.event_type,
                    actor=actor,
                    related_object_id=event.data.get("dm_request_id"),
                    title=NotificationService._get_title(event, recipient),
                    description=NotificationService._get_description(event),
                    metadata=event.data,
                )
                notification_ids.append(notification.id)

            # Emit realtime events (non-blocking)
            NotificationService._emit_async(event, notification_ids)

            return notification_ids[0] if notification_ids else None

        except Exception as e:
            logger.exception(f"NotificationService.create_and_emit failed: {e}")
            return None

    @staticmethod
    def _get_recipients(event: NotificationEvent) -> list[User]:
        """Determine which user(s) should receive this notification."""
        if event.event_type == "dm_request":
            try:
                return [User.objects.get(id=event.data.get("receiver_id"))]
            except User.DoesNotExist:
                return []

        # Add other event types here
        return []

    @staticmethod
    def _check_preferences(user: User, event: NotificationEvent) -> bool:
        """Check if user has enabled notifications for this event type."""
        try:
            prefs = user.notification_preferences
        except:
            # No preferences created yet; default to enabled
            return True

        if prefs.all_notifications_muted:
            return False

        if event.event_type == "dm_request" and not prefs.dm_requests_enabled:
            return False
        if event.event_type == "mention" and not prefs.mentions_enabled:
            return False
        if event.event_type == "channel_invite" and not prefs.channel_invites_enabled:
            return False
        if event.event_type == "task_assigned" and not prefs.task_assignments_enabled:
            return False

        return True

    @staticmethod
    def _get_title(event: NotificationEvent, recipient: User) -> str:
        """Generate notification title."""
        if event.event_type == "dm_request":
            sender_name = event.data.get("sender_name", "Unknown")
            return f"{sender_name} sent you a DM request"
        return f"Notification: {event.event_type}"

    @staticmethod
    def _get_description(event: NotificationEvent) -> str:
        """Generate notification description."""
        if event.event_type == "dm_request":
            return "Tap to view and respond"
        return ""

    @staticmethod
    def _emit_async(event: NotificationEvent, notification_ids: list[int]) -> None:
        """
        Emit event asynchronously to channel layer.
        Uses database_sync_to_async to wrap in event loop.
        """
        try:
            import asyncio

            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Already in async context; schedule as task
                asyncio.create_task(
                    AsyncNotificationService._emit_to_groups(event, notification_ids)
                )
            else:
                # Run in new event loop
                asyncio.run(
                    AsyncNotificationService._emit_to_groups(event, notification_ids)
                )
        except Exception as e:
            logger.warning(f"Failed to emit async notification: {e}")

    @staticmethod
    def mark_notification_read(notification_id: int) -> bool:
        """Mark a notification as read."""
        from chat.models import Notification

        try:
            notification = Notification.objects.get(id=notification_id)
            notification.mark_read()
            return True
        except Notification.DoesNotExist:
            return False

    @staticmethod
    def get_unread_count(user: User, workspace: Optional[Workspace] = None) -> int:
        """Get unread notification count for a user."""
        from chat.models import Notification

        query = Notification.objects.filter(recipient=user, status="unread")
        if workspace:
            query = query.filter(workspace=workspace)
        return query.count()


class AsyncNotificationService:
    """
    Async variants of notification service. Used in WebSocket consumers.
    All methods are async and database_sync_to_async-wrapped where needed.
    """

    @staticmethod
    async def create_and_emit(event: NotificationEvent) -> Optional[int]:
        """Async version of NotificationService.create_and_emit."""
        return await database_sync_to_async(NotificationService.create_and_emit)(event)

    @staticmethod
    async def _emit_to_groups(
        event: NotificationEvent, notification_ids: list[int]
    ) -> None:
        """
        Emit event to appropriate WebSocket groups based on event type.

        Routes:
        - dm_request → user_{receiver_id} group
        - mention → user_{mentioned_user_id} group
        - channel_invite → user_{recipient_id} group
        """
        channel_layer = get_channel_layer()

        if event.event_type == "dm_request":
            receiver_id = event.data.get("receiver_id")
            group_name = f"user_{receiver_id}"

            # Send notification event to user's WebSocket group
            await channel_layer.group_send(
                group_name,
                {
                    "type": "notification_dm_request",  # Calls notification_dm_request() in consumer
                    "event": event.to_dict(),
                    "notification_id": (
                        notification_ids[0] if notification_ids else None
                    ),
                },
            )
            logger.debug(f"Emitted dm_request event to group {group_name}")

        # Add other event type routes here

    @staticmethod
    async def mark_notification_read(notification_id: int) -> bool:
        """Async mark notification as read."""
        return await database_sync_to_async(NotificationService.mark_notification_read)(
            notification_id
        )

    @staticmethod
    async def get_unread_count(
        user: User, workspace: Optional[Workspace] = None
    ) -> int:
        """Async get unread notification count."""
        return await database_sync_to_async(NotificationService.get_unread_count)(
            user, workspace
        )
