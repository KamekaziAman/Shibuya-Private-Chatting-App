from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_user_from_access_token(raw_token):
    if not raw_token:
        return AnonymousUser()

    try:
        authentication = JWTAuthentication()
        validated_token = authentication.get_validated_token(raw_token)
        return authentication.get_user(validated_token)
    except Exception:
        return AnonymousUser()


class JwtAuthMiddleware:
    """Authenticate WebSockets using a JWT access token query parameter."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
        raw_token = query_params.get("token", [None])[0]
        scope = dict(scope)
        scope["user"] = await get_user_from_access_token(raw_token)
        return await self.app(scope, receive, send)
