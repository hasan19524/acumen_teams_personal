from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/token/", TokenObtainPairView.as_view()),
    path("api/token/refresh/", TokenRefreshView.as_view()),
    path("api/attendance/", include("attendance.urls")),
    # CHAT ROUTES
    path("api/chat/", include("chat.urls")),
    path("api/workspaces/", include("workspaces.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/announcements/", include("announcements.urls")),
]
