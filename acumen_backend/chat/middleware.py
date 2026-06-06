# chat/middleware.py
#
# Production-grade JWT authentication middleware for Django Channels.
#
# Resolves the core issue: Django's AuthMiddlewareStack only authenticates
# via session cookies. Since our Next.js frontend uses JWT in localStorage,
# the browser cannot attach Authorization headers during the WS handshake.
# We pass the token as a query param (ws://.../?token=<jwt>), and this
# middleware intercepts it, validates it via SimpleJWT, and injects the
# authenticated User into scope["user"].

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.auth import AuthMiddlewareStack
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

# Get the active User model safely at module level (Django is setup by this point)
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str: str):
    """
    Validate a JWT access token string and return the corresponding User.

    Designed to be bulletproof:
    - Closes stale DB connections before executing ORM calls.
    - Gracefully returns AnonymousUser on ANY validation failure.
    - Specifically handles TokenError and InvalidToken to prevent 500s on bad tokens.
    - Uses get_user_model() to ensure it works with custom User models.
    """
    try:
        # 1. Clean up any timed-out DB connections from previous long-running WS loops
        close_old_connections()

        # 2. Validate token signature, expiry, and type
        access_token = AccessToken(token_str)

        # 3. Explicitly verify the token (checks blacklisting if enabled in settings)
        access_token.verify()

        # 4. Extract user ID
        user_id = access_token.get("user_id")
        if not user_id:
            return AnonymousUser()

        # 5. Fetch the user.
        # NOTE: We deliberately do NOT use select_related('profile') here.
        # If the user has no profile, select_related crashes with a 500 error.
        # It is the consumer's responsibility to fetch related profiles safely.
        return User.objects.get(id=user_id)

    except (TokenError, InvalidToken) as e:
        # Token is malformed, expired, or blacklisted
        # In production, you might want to log this: logger.warning(f"WS JWT rejected: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        # User was deleted from DB but token hasn't expired yet
        return AnonymousUser()
    except Exception as e:
        # Catch-all for DB failures, connection drops, etc.
        # Never let a middleware crash the ASGI event loop.
        # logger.exception(f"Unexpected WS Auth error: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware that authenticates WebSocket connections via a JWT token
    passed as a query parameter: ws://.../ws/chat/42/?token=<access_token>
    """

    async def __call__(self, scope, receive, send):
        # Only intercept WebSocket connections (let HTTP pass through natively)
        if scope["type"] == "websocket":
            # Parse the query string safely (defaults to empty bytes)
            query_string = scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            token_list = params.get("token", [])

            if token_list:
                # Token found, validate and inject user
                scope["user"] = await get_user_from_token(token_list[0])
            else:
                # No token provided, mark as anonymous
                scope["user"] = AnonymousUser()

        # Pass the (now modified) scope down the middleware chain
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience wrapper — drop-in replacement for AuthMiddlewareStack.

    Architecture:
    1. JWTAuthMiddleware runs first: tries to authenticate via ?token=
    2. AuthMiddlewareStack runs second: acts as a fallback for session auth
       (useful if you ever open WS from a Django server-rendered template)
    3. inner: the actual URLRouter

    This nesting ensures scope["user"] is resolved properly regardless of
    the connection method, while maintaining maximum compatibility.
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
