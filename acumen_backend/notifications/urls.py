from django.urls import path
from . import views

urlpatterns = [
    path(
        "<int:workspace_id>/",
        views.NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "<int:workspace_id>/bulk-mark-read/",
        views.NotificationBulkMarkReadView.as_view(),
        name="notification-bulk-read",
    ),
    path(
        "<int:workspace_id>/preferences/",
        views.NotificationPreferenceView.as_view(),
        name="notification-preferences",
    ),
    path(
        "<int:workspace_id>/unread-count/",
        views.UnreadNotificationCountView.as_view(),
        name="notification-unread-count",
    ),
    path(
        "<int:workspace_id>/<int:notification_id>/",
        views.NotificationDetailView.as_view(),
        name="notification-detail",
    ),
]
