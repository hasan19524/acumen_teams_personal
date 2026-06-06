from django.urls import path
from notifications.views import (
    NotificationListView,
    NotificationDetailView,
    NotificationBulkMarkReadView,
    NotificationPreferenceView,
    UnreadNotificationCountView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path(
        "<int:notification_id>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
    path(
        "<int:notification_id>/read/",
        NotificationDetailView.as_view(),
        name="notification-read",
    ),
    path(
        "mark-read/",
        NotificationBulkMarkReadView.as_view(),
        name="notification-bulk-read",
    ),
    path(
        "preferences/",
        NotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="unread-count"),
]
