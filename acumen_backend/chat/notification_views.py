# chat/notification_views.py
# NEW FILE: API views for notifications

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from chat.models import Notification, NotificationPreference
from chat.notification_serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
)
from chat.authorization import ChatAuthService
from chat.notifications import NotificationService, AsyncNotificationService


class NotificationListView(APIView):
    """
    List notifications for authenticated user.
    Supports filtering by status (unread, read, archived).

    GET /api/chat/notifications/?status=unread
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Filter by status if provided
        status_filter = request.query_params.get("status")

        notifications = Notification.objects.filter(
            recipient=request.user, workspace=membership.workspace
        ).order_by("-created_at")

        if status_filter:
            notifications = notifications.filter(status=status_filter)

        serializer = NotificationSerializer(notifications, many=True)

        # Include unread count
        unread_count = NotificationService.get_unread_count(
            request.user, membership.workspace
        )

        return Response(
            {
                "notifications": serializer.data,
                "unread_count": unread_count,
            }
        )


class NotificationDetailView(APIView):
    """
    Retrieve, mark as read, or delete a specific notification.

    GET /api/chat/notifications/{id}/     → Get notification
    POST /api/chat/notifications/{id}/read/  → Mark as read
    DELETE /api/chat/notifications/{id}/   → Archive notification
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def post(self, request, notification_id):
        """Mark notification as read."""
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.mark_read()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def delete(self, request, notification_id):
        """Archive notification (soft delete)."""
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.status = "archived"
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationBulkMarkReadView(APIView):
    """
    Mark multiple notifications as read at once.

    POST /api/chat/notifications/mark-read/
    {
        "notification_ids": [1, 2, 3]
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get("notification_ids", [])

        if not notification_ids:
            return Response(
                {"error": "notification_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        # Mark all notifications as read (only for this user)
        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            workspace=membership.workspace,
            status="unread",
        ).update(status="read")

        return Response(
            {
                "updated_count": updated,
            }
        )


class NotificationPreferenceView(APIView):
    """
    Get or update notification preferences for the user.

    GET /api/chat/notification-preferences/
    PATCH /api/chat/notification-preferences/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data)

    def patch(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(
            prefs, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadNotificationCountView(APIView):
    """
    Get unread notification count for workspace.

    GET /api/chat/unread-count/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        count = NotificationService.get_unread_count(request.user, membership.workspace)

        return Response(
            {
                "unread_count": count,
            }
        )
