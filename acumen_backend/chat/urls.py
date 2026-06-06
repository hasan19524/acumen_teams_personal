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
    path("dm-requests/<int:pk>/undo/", DMRequestUndoView.as_view()),
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
    
        # Files & Message Actions
    path("upload/", FileUploadView.as_view()),
    path("messages/<int:message_id>/edit/", MessageEditView.as_view()),
    path("messages/<int:message_id>/delete/", MessageDeleteView.as_view()),
    path("messages/<int:message_id>/react/", ReactionToggleView.as_view()),
    path("messages/<int:message_id>/read/", MessageMarkReadView.as_view()),
]
