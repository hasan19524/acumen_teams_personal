# config/asgi.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path

# MUST import django_asgi_app AFTER django.setup()
django_asgi_app = get_asgi_application()

# Import consumers
from chat.consumers import ChatConsumer
from notifications.consumers import NotificationConsumer

# Import your custom JWT middleware from the chat app
from chat.middleware import JWTAuthMiddlewareStack

websocket_urlpatterns = [
    path("ws/chat/<int:channel_id>/", ChatConsumer.as_asgi()),
    path("ws/notifications/", NotificationConsumer.as_asgi()),
]

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)
