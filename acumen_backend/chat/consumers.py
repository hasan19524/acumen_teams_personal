# acumen_backend/chat/consumers.py
import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from chat.authorization import AsyncChatAuthService, WSCloseCodes
from notifications.services import (
    AsyncNotificationService,
    MentionEvent,
)
from channels.layers import get_channel_layer
from django.contrib.auth.models import User
import re

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.channel_id = self.scope["url_route"]["kwargs"]["channel_id"]
        self.channel_group_name = f"chat_{self.channel_id}"
        self.user_group_name = f"user_{self.user.id}" if self.user else None

        is_allowed, close_code = await AsyncChatAuthService.check_channel_access(
            self.user, self.channel_id
        )

        if not is_allowed:
            await self.close(code=close_code)
            return

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

        await self.channel_layer.group_send(
            self.channel_group_name,
            {
                "type": "user_presence",
                "user_id": self.user.id,
                "username": self.user.username,
                "status": "online",
            },
        )

        await self._increment_presence()
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

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
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

    async def _handle_typing(self):
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
        content = (data.get("content") or "").strip()
        if not content:
            return

        client_id = data.get("client_id")
        reply_to_id = data.get("reply_to")

        is_allowed, reason = await AsyncChatAuthService.check_can_send_message(
            self.user, self.channel_id
        )
        if not is_allowed:
            await self.send(text_data=json.dumps({"type": "error", "reason": reason}))
            return

        saved_data = await self._save_message(
            self.channel_id, self.user, content, client_id, reply_to_id
        )
        if not saved_data:
            return

        await self.channel_layer.group_send(
            self.channel_group_name,
            {"type": "chat_message", "event": "message.created", "data": saved_data},
        )

        await self._notify_mentions(content, saved_data)

    async def chat_message(self, event):
        payload = {
            "type": "message",
            "event": event.get("event", "message.created"),
            "data": event.get("data", {}),
        }
        await self.send(text_data=json.dumps(payload))

    async def typing_indicator(self, event):
        if event["user_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "data": {
                        "channel": event["channel_id"],
                        "user": {"id": event["user_id"], "username": event["username"]},
                    },
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

    async def notification_dm_request(self, event):
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

    @database_sync_to_async
    def _save_message(
        self,
        channel_id: str,
        user,
        content: str,
        client_id: str = None,
        reply_to_id: int = None,
    ) -> dict | None:
        from chat.models import Channel, Message
        from chat.serializers import MessageSerializer
        from chat.services.chat_service import ChatService

        try:
            channel = Channel.objects.get(id=int(channel_id))
            parent_message_id = None
            if reply_to_id:
                if Message.objects.filter(
                    id=reply_to_id, channel_id=int(channel_id)
                ).exists():
                    parent_message_id = reply_to_id

            msg = ChatService.save_message(
                channel=channel,
                sender=user,
                content=content,
                client_id=client_id,
                parent_message_id=parent_message_id,
            )

            # Re-fetch with select_related for nested reply_to serialization
            msg = (
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
                .get(id=msg.id)
            )
            return MessageSerializer(msg).data
        except Exception as e:
            logger.exception("ChatConsumer._save_message failed: %s", e)
            return None

    async def _increment_presence(self) -> None:
        try:
            from django_redis import get_redis_connection

            redis_conn = get_redis_connection("default")
            presence_key = f"presence:user:{self.user.id}"
            count = await database_sync_to_async(redis_conn.incr)(presence_key)
            await database_sync_to_async(redis_conn.expire)(presence_key, 300)
        except Exception as e:
            logger.warning(f"Failed to increment presence: {e}")

    async def _decrement_presence(self) -> bool:
        try:
            from django_redis import get_redis_connection

            redis_conn = get_redis_connection("default")
            presence_key = f"presence:user:{self.user.id}"
            count = await database_sync_to_async(redis_conn.decr)(presence_key)
            if count <= 0:
                await database_sync_to_async(redis_conn.delete)(presence_key)
                return True
            return False
        except Exception as e:
            logger.warning(f"Failed to decrement presence: {e}")
            return False

    async def _backfill_dm_requests(self) -> None:
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
        except Exception as e:
            logger.warning(f"Failed to backfill DM requests: {e}")

    async def _notify_mentions(self, content: str, saved_data: dict) -> None:
        try:
            mentioned_usernames = self._extract_mentions(content)
            if not mentioned_usernames:
                return

            mentioned_user_ids = await self._resolve_mentioned_users(
                mentioned_usernames, self.channel_id
            )
            if not mentioned_user_ids:
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

            # NotificationService now fully handles both DB persistence and WS emission
            await AsyncNotificationService.create_and_emit(event)
        except Exception as e:
            logger.warning(f"Failed to notify mentions: {e}")

    @staticmethod
    def _extract_mentions(content: str) -> list[str]:
        return list(set(re.findall(r"@(\w+)", content)))

    @database_sync_to_async
    def _resolve_mentioned_users(
        self, usernames: list[str], channel_id: int
    ) -> list[int]:
        from chat.models import ChannelMember

        return list(
            ChannelMember.objects.filter(
                channel_id=channel_id, user__username__in=usernames, is_active=True
            )
            .exclude(user=self.user)
            .values_list("user_id", flat=True)
        )

    @database_sync_to_async
    def _get_channel_workspace_id(self, channel_id: int) -> int:
        from chat.models import Channel

        return (
            Channel.objects.select_related("workspace").get(id=channel_id).workspace_id
        )

    @database_sync_to_async
    def _get_channel_name(self, channel_id: int) -> str:
        from chat.models import Channel

        try:
            return Channel.objects.get(id=channel_id).name
        except Channel.DoesNotExist:
            return ""

    @database_sync_to_async
    def _get_pending_dm_requests(self) -> list[dict]:
        from chat.models import DMRequest

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
