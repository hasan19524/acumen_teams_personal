# chat/middleware.py
#
# JWT authentication middleware for Django Channels WebSocket connections.
#
# Why this exists:
#   Django's built-in AuthMiddlewareStack only handles session-cookie auth.
#   Our REST API uses JWT tokens stored in localStorage. When the browser opens
#   a WebSocket, it cannot set Authorization headers — the WS handshake is an
#   HTTP GET, and browsers don't let JS set headers on it. The standard
#   workaround is to pass the token as a URL query param: ws://.../?token=<jwt>
#
# This middleware intercepts the WS handshake, extracts the token from the
# query string, validates it with simplejwt, and injects the authenticated
# Django User into scope["user"] — exactly what AuthMiddlewareStack would do
# for session auth.
#
# Security notes:
#   - Token in query string will appear in server logs. For production, rotate
#     short-lived access tokens (already configured: 1 day). This is the
#     accepted tradeoff for browser WebSocket auth.
#   - We validate with simplejwt's AccessToken, so expiry, signature, and
#     token type are all checked.

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser, User
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken


@database_sync_to_async
def get_user_from_token(token_str: str):
    """
    Validate a JWT access token string and return the corresponding User.
    Returns AnonymousUser on any failure — never raises.
    """
    try:
        token = AccessToken(token_str)
        user_id = token["user_id"]
        return User.objects.get(id=user_id)
    except (TokenError, InvalidToken, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware that authenticates WebSocket connections via a JWT token
    passed as a query parameter: ws://.../ws/chat/42/?token=<access_token>
    """

    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope["type"] == "websocket":
            query_string = scope.get("query_string", b"").decode()
            params = parse_qs(query_string)
            token_list = params.get("token", [])

            if token_list:
                scope["user"] = await get_user_from_token(token_list[0])
            else:
                scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience wrapper — drop-in replacement for AuthMiddlewareStack.
    Usage in asgi.py:
        "websocket": JWTAuthMiddlewareStack(URLRouter(...))
    """
    return JWTAuthMiddleware(inner)
