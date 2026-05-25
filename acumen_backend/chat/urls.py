# chat/urls.py

from django.urls import path
from .views import (
    ChannelListCreateView,
    ChannelMemberManageView,
    DMListCreateView,
    DMRequestListCreateView,
    DMRequestRespondView,
    BlockView,
    ReportCreateView,
    ReportAdminView,
    MessageListView,
    SendMessageView,
    WorkspaceUsersView,
    NotificationListView,
    NotificationDetailView,
    NotificationBulkMarkReadView,
    NotificationPreferenceView,
    UnreadNotificationCountView,
)

urlpatterns = [
    # Channels
    path("channels/", ChannelListCreateView.as_view()),
    path("channels/<int:channel_id>/members/", ChannelMemberManageView.as_view()),
    # DMs — admin bypass (open DM directly, no request needed for admins)
    path("dms/", DMListCreateView.as_view()),
    # DM Requests — request-based flow for non-admins
    path("dm-requests/", DMRequestListCreateView.as_view()),
    path("dm-requests/<int:pk>/", DMRequestRespondView.as_view()),
    # Blocks
    path("blocks/", BlockView.as_view()),
    path("blocks/<int:user_id>/", BlockView.as_view()),
    # Reports
    path("reports/", ReportCreateView.as_view()),
    path("reports/admin/", ReportAdminView.as_view()),
    path("reports/admin/<int:pk>/", ReportAdminView.as_view()),
    # Messages
    path("messages/<int:channel_id>/", MessageListView.as_view()),
    path("send/", SendMessageView.as_view()),
    # Users in workspace (for DM picker)
    path("users/", WorkspaceUsersView.as_view()),
    
    # Notifications
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:notification_id>/", NotificationDetailView.as_view(), name="notification-detail"),
    path("notifications/mark-read/", NotificationBulkMarkReadView.as_view(), name="mark-read"),
    path("notification-preferences/", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="unread-count"),
]
