# acumen_backend/config/routing.py
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter

from chat.consumers import ChatConsumer
from chat.consumers import TypingConsumer
from notifications.consumers import NotificationConsumer
from chat.middleware import JWTAuthMiddlewareStack  # Use the custom JWT middleware

application = ProtocolTypeRouter(
    {
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(
                [
                    path("ws/chat/<int:channel_id>/", ChatConsumer.as_asgi()),
                    path("ws/typing/", TypingConsumer.as_asgi()),
                    path("ws/notifications/", NotificationConsumer.as_asgi()),
                ]
            )
        ),
    }
)
