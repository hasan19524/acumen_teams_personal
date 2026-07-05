# chat/urls.py
from django.urls import path
from .views import (
    ChannelListCreateView,
    ChannelMemberManageView,
    DMListCreateView,
    DMRequestListCreateView,
    DMRequestRespondView,
    DMRequestUndoView,
    BlockView,
    ReportCreateView,
    ReportAdminView,
    MessageListView,
    SendMessageView,
    WorkspaceUsersView,
    FileUploadView,
    MessageEditView,
    MessageDeleteView,
    ReactionToggleView,
    MessageMarkReadView,
    MessageHideView,
    MarkChannelReadView,
    ChannelClearView,
    ChannelDeleteView,
)

urlpatterns = [
    # Channels
    path("<int:workspace_id>/channels/", ChannelListCreateView.as_view()),
    path(
        "<int:workspace_id>/channels/<int:channel_id>/members/",
        ChannelMemberManageView.as_view(),
    ),
    path(
        "<int:workspace_id>/channels/<int:channel_id>/read/",
        MarkChannelReadView.as_view(),
        name="mark_channel_read",
    ),
    path(
        "<int:workspace_id>/channels/<int:channel_id>/clear/",
        ChannelClearView.as_view(),
        name="clear_channel",
    ),
    path(
        "<int:workspace_id>/channels/<int:channel_id>/delete/",
        ChannelDeleteView.as_view(),
        name="delete_channel",
    ),
    # DMs
    path("<int:workspace_id>/dms/", DMListCreateView.as_view()),
    path("<int:workspace_id>/dm-requests/", DMRequestListCreateView.as_view()),
    path("<int:workspace_id>/dm-requests/<int:pk>/", DMRequestRespondView.as_view()),
    path("<int:workspace_id>/dm-requests/<int:pk>/undo/", DMRequestUndoView.as_view()),
    # Blocks
    path("<int:workspace_id>/blocks/", BlockView.as_view()),
    path("<int:workspace_id>/blocks/<int:user_id>/", BlockView.as_view()),
    # Reports
    path("<int:workspace_id>/reports/", ReportCreateView.as_view()),
    path("<int:workspace_id>/reports/admin/", ReportAdminView.as_view()),
    path("<int:workspace_id>/reports/admin/<int:pk>/", ReportAdminView.as_view()),
    # Messages
    path("<int:workspace_id>/messages/<int:channel_id>/", MessageListView.as_view()),
    path("<int:workspace_id>/send/", SendMessageView.as_view()),
    path("<int:workspace_id>/upload/", FileUploadView.as_view()),
    path(
        "<int:workspace_id>/messages/<int:message_id>/edit/", MessageEditView.as_view()
    ),
    path(
        "<int:workspace_id>/messages/<int:message_id>/delete/",
        MessageDeleteView.as_view(),
    ),
    path(
        "<int:workspace_id>/messages/<int:message_id>/react/",
        ReactionToggleView.as_view(),
    ),
    path(
        "<int:workspace_id>/messages/<int:message_id>/read/",
        MessageMarkReadView.as_view(),
    ),
    path(
        "<int:workspace_id>/messages/<int:message_id>/hide/",
        MessageHideView.as_view(),
        name="hide_message",
    ),
    # Users
    path("<int:workspace_id>/users/", WorkspaceUsersView.as_view()),
]
