from django.urls import path
from .views import (
    ChannelListCreateView,
    MessageListView,
    SendMessageView,
)

urlpatterns = [
    path("channels/", ChannelListCreateView.as_view()),
    path("messages/<int:channel_id>/", MessageListView.as_view()),
    path("send/", SendMessageView.as_view()),
]