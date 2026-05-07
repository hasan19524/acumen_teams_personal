# chat/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.group_name = f"chat_{self.room}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content", "").strip()
        sender = data.get("sender", "User")

        if not content:
            return

        await self.save_message(self.room, sender, content)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_message",
                "content": content,
                "sender": sender,
            },
        )

    @database_sync_to_async
    def save_message(self, channel_id, username, content):
        from django.contrib.auth.models import User
        from chat.models import Message

        try:
            user = User.objects.get(username=username)
            Message.objects.create(
                channel_id=channel_id,
                sender=user,
                content=content,
            )
        except User.DoesNotExist:
            pass

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "content": event["content"],
                    "sender": event["sender"],
                }
            )
        )
