import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Dedicated WebSocket for real-time notifications.
    Connects to /ws/notifications/
    """

    async def connect(self):
        self.user = self.scope.get("user")

        # Reject if not logged in
        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return

        # Join this user's personal notification group
        self.group_name = f"notifications_{self.user.id}"

        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"User {self.user.id} connected to notification WS")
        except Exception as e:
            logger.error(f"NotificationConsumer connect error: {e}")
            await self.close(code=5010)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            try:
                await self.channel_layer.group_discard(
                    self.group_name, self.channel_name
                )
            except Exception as e:
                logger.warning(f"NotificationConsumer disconnect error: {e}")

    async def receive(self, text_data):
        # Client can send pings to keep connection alive
        data = json.loads(text_data)
        if data.get("type") == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))

    # ── Event Handlers ──────────────────────────────────────

    async def notification_event(self, event):
        """
        Catches events sent by AsyncNotificationService
        and pushes them to the frontend.
        """
        payload = {
            "type": "notification",
            "notification_type": event["event"].get("event_type"),
            "notification_id": event.get("notification_id"),
            "data": event["event"].get("data", {}),
            "timestamp": event["event"].get("timestamp"),
        }
        await self.send(text_data=json.dumps(payload))
