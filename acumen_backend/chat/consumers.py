# chat/consumers.py (UPDATED/COMPLETE FILE)
# Changes:
# 1. Added user_{user_id} group join on connect
# 2. Added notification event handlers
# 3. Added backfill logic for DM requests on reconnect
# 4. Added presence tracking to Redis (multi-tab safe)

import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from chat.authorization import AsyncChatAuthService, WSCloseCodes
from chat.notifications import AsyncNotificationService

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for chat. Handles:
    - Channel-scoped messaging (chat_{channel_id})
    - User-scoped notifications (user_{user_id})
    - Multi-tab presence tracking via Redis
    - Reconnect safety with backfill
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.channel_id = self.scope["url_route"]["kwargs"]["room"]
        self.channel_group_name = f"chat_{self.channel_id}"
        self.user_group_name = f"user_{self.user.id}" if self.user else None

        # Delegate full auth check to service (auth + workspace + membership)
        is_allowed, close_code = await AsyncChatAuthService.check_channel_access(
            self.user, self.channel_id
        )

        if not is_allowed:
            await self.close(code=close_code)
            return

        # Join channel group — wrap in try/except so a Redis blip closes
        # the socket cleanly with code 5010 instead of crashing Daphne.
        try:
            await self.channel_layer.group_add(
                self.channel_group_name, self.channel_name
            )
            if self.user_group_name:
                await self.channel_layer.group_add(
                    self.user_group_name, self.channel_name
                )
        except Exception as e:
            logger.error("ChatConsumer: channel layer unavailable on connect: %s", e)
            await self.close(code=5010)
            return

        await self.accept()

        # Broadcast presence to channel group
        await self.channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "user_presence",
                "user_id": self.user.id,
                "username": self.user.username,
                "status": "online",
            },
        )

        # NEW: Update presence in Redis (multi-tab safe)
        await self._increment_presence()

        # NEW: Send pending DM requests to client (backfill on reconnect)
        if self.user:
            await self._backfill_dm_requests()

    async def disconnect(self, close_code):
        if not hasattr(self, "channel_group_name"):
            return

        try:
            if self.user and not isinstance(self.user, AnonymousUser):
                is_offline = await self._decrement_presence()
                if is_offline:
                    await self.channel_layer.group_send(
                        self.channel_group_name,
                        {
                            "type": "user_presence",
                            "user_id": self.user.id,
                            "username": self.user.username,
                            "status": "offline",
                        },
                    )

            await self.channel_layer.group_discard(
                self.channel_group_name, self.channel_name
            )

            if self.user_group_name:
                await self.channel_layer.group_discard(
                    self.user_group_name, self.channel_name
                )
        except Exception as e:
            logger.warning("ChatConsumer: channel layer error on disconnect: %s", e)
            # Do not re-raise — disconnect must never crash

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.warning(
                "ChatConsumer: invalid JSON from user %s in channel %s",
                getattr(self.user, "id", "?"),
                self.channel_id,
            )
            return

        msg_type = data.get("type", "message")

        if msg_type == "ping":
            await self.send(
                text_data=json.dumps(
                    {"type": "pong", "timestamp": timezone.now().isoformat()}
                )
            )
            return

        if msg_type == "typing":
            await self._handle_typing()
            return

        if msg_type == "message":
            await self._handle_message(data)
            return

        # Unknown type — ignore silently (don't crash the connection)
        logger.debug(
            "ChatConsumer: unknown message type '%s' from user %s",
            msg_type,
            getattr(self.user, "id", "?"),
        )

    # ── Message handlers ──────────────────────────────────────────────────────

    async def _handle_typing(self):
        """Broadcast typing indicator — ephemeral, not persisted."""
        await self.channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "typing_indicator",
                "user_id": self.user.id,
                "username": self.user.username,
            },
        )

    async def _handle_message(self, data: dict):
        """
        Validate, persist, and broadcast a chat message.

        Authorization is re-checked here (not just on connect) to catch:
          - Mid-session blocks: user A blocks user B after B connects to DM
          - Workspace deactivation: user is removed from workspace mid-session
          - Guest role changes: user is downgraded to guest mid-session
        """
        content = (data.get("content") or "").strip()
        if not content:
            return

        # Per-message auth check
        is_allowed, reason = await AsyncChatAuthService.check_can_send_message(
            self.user, self.channel_id
        )
        if not is_allowed:
            # Notify sender why their message was rejected (only they see this)
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "reason": reason,
                    }
                )
            )
            return

        saved = await self._save_message(self.channel_id, self.user, content)
        if not saved:
            logger.error(
                "ChatConsumer: failed to save message for user %s in channel %s",
                self.user.id,
                self.channel_id,
            )
            return

        await self.channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "chat_message",
                "id": saved["id"],
                "content": saved["content"],
                "sender": self.user.username,
                "sender_id": self.user.id,
                "created_at": saved["created_at"],
            },
        )

    # ── Channel layer event handlers (outbound to WebSocket clients) ──────────

    async def chat_message(self, event):

        if "data" in event:
            payload = event["data"]
            payload["type"] = "message"  # Ensure the frontend knows it's a message
            await self.send(text_data=json.dumps(payload))
        else:
            # Fallback for standard text messages sent directly via WS
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "message",
                        "id": event["id"],
                        "content": event["content"],
                        "sender": event["sender"],
                        "sender_id": event["sender_id"],
                        "created_at": event["created_at"],
                    }
                )
            )

    async def typing_indicator(self, event):
        # Do not echo back to the sender
        if event["user_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "username": event["username"],
                }
            )
        )

    async def user_presence(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "presence",
                    "user_id": event["user_id"],
                    "username": event["username"],
                    "status": event["status"],
                }
            )
        )

    # ── NEW: Notification handlers ────────────────────────────────────────────

    async def notification_dm_request(self, event):
        """
        Receive DM request notification event.
        Called when another user sends a DM request to this user.
        """
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "notification_type": "dm_request",
                    "notification_id": event.get("notification_id"),
                    "actor_id": event["event"]["actor_id"],
                    "actor_name": event["event"]["data"].get("sender_name"),
                    "dm_request_id": event["event"]["data"].get("dm_request_id"),
                    "timestamp": event["event"]["timestamp"],
                }
            )
        )
        logger.info(
            f"User {self.user.id} received dm_request notification for request {event.get('notification_id')}"
        )

    # ── Database helpers ──────────────────────────────────────────────────────

    @database_sync_to_async
    def _save_message(self, channel_id: str, user, content: str) -> dict | None:
        """
        Persist message to DB. Returns serializable dict or None on error.
        Kept here (not in service) because it's a persistence operation,
        not an authorization decision.
        """
        from chat.models import Message

        try:
            msg = Message.objects.create(
                channel_id=int(channel_id),
                sender=user,
                content=content,
            )
            return {
                "id": msg.id,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
        except Exception as e:
            logger.exception("ChatConsumer._save_message failed: %s", e)
            return None

    # ── NEW: Presence tracking with Redis ──────────────────────────────────────

    async def _increment_presence(self) -> None:
        """
        Increment user's presence counter in Redis.
        This is multi-tab safe: counter increases with each tab, decreases with each close.
        Once counter > 0, user is "online" in the workspace.
        """
        try:
            from django_redis import get_redis_connection

            redis_conn = get_redis_connection("default")
            presence_key = f"presence:user:{self.user.id}"
            # INCR: atomically increment and return new value
            count = await database_sync_to_async(redis_conn.incr)(presence_key)
            # Set TTL to 5 minutes (auto-cleanup if connection dies)
            await database_sync_to_async(redis_conn.expire)(presence_key, 300)
            logger.debug(f"User {self.user.id} presence incremented to {count}")
        except Exception as e:
            logger.warning(f"Failed to increment presence: {e}")

    async def _decrement_presence(self) -> bool:
        """
        Decrement user's presence counter in Redis.
        When counter hits 0, user is "offline".
        """
        try:
            from django_redis import get_redis_connection

            redis_conn = get_redis_connection("default")
            presence_key = f"presence:user:{self.user.id}"
            # DECR: atomically decrement, returns new value
            count = await database_sync_to_async(redis_conn.decr)(presence_key)
            # If count <= 0, delete key
            if count <= 0:
                await database_sync_to_async(redis_conn.delete)(presence_key)
                logger.debug(f"User {self.user.id} marked offline (count was {count})")
                return True
            else:
                logger.debug(f"User {self.user.id} presence decremented to {count}")
                return False
        except Exception as e:
            logger.warning(f"Failed to decrement presence: {e}")
            return False

    # ── NEW: Backfill logic for reconnect ──────────────────────────────────────

    async def _backfill_dm_requests(self) -> None:
        """
        On reconnect, send pending DM requests to client.
        This ensures client has all DM requests even if they missed realtime events.
        """
        try:
            dm_requests = await self._get_pending_dm_requests()
            if dm_requests:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "backfill",
                            "data_type": "dm_requests",
                            "items": dm_requests,
                        }
                    )
                )
                logger.info(
                    f"Backfilled {len(dm_requests)} DM requests for user {self.user.id}"
                )
        except Exception as e:
            logger.warning(f"Failed to backfill DM requests: {e}")

    @database_sync_to_async
    def _get_pending_dm_requests(self) -> list[dict]:
        """
        Fetch all pending DM requests for the user.
        Used for reconnect backfill.
        """
        from chat.models import DMRequest
        from django.contrib.auth.models import User as DjangoUser

        requests = (
            DMRequest.objects.filter(receiver=self.user, status="pending")
            .select_related("sender", "workspace")
            .values("id", "sender_id", "sender__username", "workspace_id", "created_at")
        )

        return [
            {
                "id": req["id"],
                "sender_id": req["sender_id"],
                "sender_name": req["sender__username"],
                "workspace_id": req["workspace_id"],
                "created_at": req["created_at"].isoformat(),
            }
            for req in requests
        ]
