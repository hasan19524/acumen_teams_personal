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
from notifications.services import (
    AsyncNotificationService,
    NotificationService,
    MentionEvent,
)
from channels.layers import get_channel_layer
from django.contrib.auth.models import User
import re

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
        self.channel_id = self.scope["url_route"]["kwargs"]["channel_id"]
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
                "channel_id": self.channel_id,
                "user_id": self.user.id,
                "username": self.user.username,
            },
        )

    async def _handle_message(self, data: dict):
        """
        Validate, persist, and broadcast a chat message.
        """
        content = (data.get("content") or "").strip()
        if not content:
            return

        client_id = data.get("client_id")  # Extract client_id from frontend
        reply_to_id = data.get("reply_to")  # NEW: Extract reply_to ID from frontend

        # Per-message auth check
        is_allowed, reason = await AsyncChatAuthService.check_can_send_message(
            self.user, self.channel_id
        )
        if not is_allowed:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "reason": reason,
                    }
                )
            )
            return

        # DM request restriction: sender can only send 1 message while pending
        dm_restricted = await self._check_dm_request_restriction(self.channel_id)
        if dm_restricted:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "reason": "dm_request_pending",
                    }
                )
            )
            return

        # Now returns the fully serialized Message dictionary
        saved_data = await self._save_message(
            self.channel_id, self.user, content, client_id, reply_to_id
        )
        if not saved_data:
            logger.error(
                "ChatConsumer: failed to save message for user %s in channel %s",
                self.user.id,
                self.channel_id,
            )
            return

        # Broadcast the unified, standardized payload
        await self.channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "chat_message",
                "event": "message.created",  # Standardized event name
                "data": saved_data,  # Contains sender object, attachments array, etc.
            },
        )

        # Check for @mentions and notify mentioned users
        await self._notify_mentions(content, saved_data)

    # ── Channel layer event handlers (outbound to WebSocket clients) ──────────

    async def chat_message(self, event):
        """
        Handles outbound WS events for messages (created, updated, deleted).
        Maintains the standardized nested envelope so the frontend can parse it.
        """
        payload = {
            "type": "message",
            "event": event.get("event", "message.created"),
            "data": event.get("data", {}),
        }
        await self.send(text_data=json.dumps(payload))

    async def typing_indicator(self, event):
        # Do not echo back to the sender
        if event["user_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "data": {
                        "channel": event["channel_id"],
                        "user": {
                            "id": event["user_id"],
                            "username": event["username"],
                        }
                    }
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
    def _save_message(
        self,
        channel_id: str,
        user,
        content: str,
        client_id: str = None,
        reply_to_id: int = None,
    ) -> dict | None:
        """
        Persist message to DB. Returns fully serialized Message dict
        with nested reply_to object.
        """
        from chat.models import Message
        from chat.serializers import MessageSerializer

        try:
            # Idempotency check: if client_id is provided, check if message already exists
            if client_id:
                existing = (
                    Message.objects.filter(
                        channel_id=int(channel_id), client_id=client_id
                    )
                    .select_related(
                        "sender", "parent_message", "parent_message__sender"
                    )
                    .prefetch_related("attachments", "parent_message__attachments", "reactions", "reactions__user", "reads", "reads__user")
                    .first()
                )
                if existing:
                    serializer = MessageSerializer(existing)
                    return serializer.data

            # Validate reply_to_id: must exist and be in the same channel
            parent_message_id = None
            if reply_to_id:
                if Message.objects.filter(
                    id=reply_to_id, channel_id=int(channel_id)
                ).exists():
                    parent_message_id = reply_to_id
                else:
                    logger.warning(
                        "ChatConsumer: reply_to_id %s not found in channel %s — ignoring reply",
                        reply_to_id,
                        channel_id,
                    )

            msg = Message.objects.create(
                channel_id=int(channel_id),
                sender=user,
                content=content,
                client_id=client_id,
                parent_message_id=parent_message_id,
            )

            # Re-fetch with select_related so nested reply_to serializes correctly
            msg = (
                Message.objects.select_related(
                    "sender",
                    "parent_message",
                    "parent_message__sender",
                )
                .prefetch_related(
                    "attachments",
                    "parent_message__attachments",
                    "reactions",
                    "reactions__user",
                    "reads",
                    "reads__user",
                )
                .get(id=msg.id)
            )

            serializer = MessageSerializer(msg)
            return serializer.data
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

    async def _notify_mentions(self, content: str, saved_data: dict) -> None:
        """
        Parse @username mentions from message content,
        resolve to user IDs, create DB notification, and emit WS event directly.
        """
        try:
            mentioned_usernames = self._extract_mentions(content)
            if not mentioned_usernames:
                return

            mentioned_user_ids = await self._resolve_mentioned_users(
                mentioned_usernames, self.channel_id
            )
            if not mentioned_user_ids:
                logger.debug(f"No valid mentions found for: {mentioned_usernames}")
                return

            workspace_id = await self._get_channel_workspace_id(self.channel_id)
            channel_name = await self._get_channel_name(self.channel_id)

            event = MentionEvent(
                actor_id=self.user.id,
                workspace_id=workspace_id,
                channel_id=int(self.channel_id),
                channel_name=channel_name,
                message_id=saved_data.get("id"),
                message_preview=content[:100],
                mentioned_user_ids=mentioned_user_ids,
            )

            # Create DB records (sync)
            notification_id = await AsyncNotificationService.create_and_emit(event)

            # Emit WS event directly — the internal _emit_async inside create_and_emit
            # silently fails when called from database_sync_to_async's thread pool.
            if notification_id:
                channel_layer = get_channel_layer()
                for uid in mentioned_user_ids:
                    group_name = f"notifications_{uid}"
                    await channel_layer.group_send(
                        group_name,
                        {
                            "type": "notification_event",
                            "event": event.to_dict(),
                            "notification_id": notification_id,
                        },
                    )
                logger.info(
                    f"Sent mention notification to {len(mentioned_user_ids)} users"
                )
        except Exception as e:
            logger.warning(f"Failed to notify mentions: {e}")

    @staticmethod
    def _extract_mentions(content: str) -> list[str]:
        """Extract @username patterns from message content."""
        return list(set(re.findall(r"@(\w+)", content)))

    @database_sync_to_async
    def _resolve_mentioned_users(
        self, usernames: list[str], channel_id: int
    ) -> list[int]:
        """
        Look up usernames that are members of this channel.
        Returns user IDs for valid mentions only.
        """
        from chat.models import ChannelMember

        return list(
            ChannelMember.objects.filter(
                channel_id=channel_id,
                user__username__in=usernames,
                is_active=True,  # Only mention active members
            )
            .exclude(user=self.user)
            .values_list("user_id", flat=True)
        )

    @database_sync_to_async
    def _get_channel_workspace_id(self, channel_id: int) -> int:
        """Get workspace ID for a channel."""
        from chat.models import Channel

        channel = Channel.objects.select_related("workspace").get(id=channel_id)
        return channel.workspace_id

    @database_sync_to_async
    def _get_channel_name(self, channel_id: int) -> str:
        """Get channel name for notification title."""
        from chat.models import Channel

        try:
            channel = Channel.objects.get(id=channel_id)
            return channel.name
        except Channel.DoesNotExist:
            return ""

    @database_sync_to_async
    def _check_dm_request_restriction(self, channel_id: str) -> bool:
        """
        Returns True if the user is restricted from sending more messages.
        A DM with a pending request allows only 1 intro message from the sender.
        The receiver is never restricted.
        """
        from chat.models import Channel, DMRequest, Message
        try:
            channel = Channel.objects.get(id=int(channel_id))
            if not channel.is_dm:
                return False

            # Find pending DM request linked to this channel
            pending_request = DMRequest.objects.filter(
                dm_channel=channel,
                status="pending",
            ).first()

            if not pending_request:
                return False

            # Only restrict the SENDER, not the receiver
            if pending_request.sender_id != self.user.id:
                return False

            # Sender can only send 1 message while request is pending
            return Message.objects.filter(
                channel=channel,
                sender_id=self.user.id,
            ).count() >= 1
        except Exception:
            return False

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
