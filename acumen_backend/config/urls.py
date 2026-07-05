from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    try:
        connection.ensure_connection()
        return Response({"status": "healthy", "database": "up"}, status=200)
    except Exception as e:
        return Response({"status": "unhealthy", "error": str(e)}, status=503)

urlpatterns = [
    path("health/", health_check),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
    path("api/attendance/", include("attendance.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/workspaces/", include("workspaces.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/announcements/", include("announcements.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/support/", include("support.urls")),
    path("api/uploads/", include("upload.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)