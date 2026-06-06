from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from notifications.models import Notification, NotificationPreference
from notifications.serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
)
from chat.authorization import ChatAuthService
from notifications.services import NotificationService, AsyncNotificationService
from notifications.selectors.notification_selector import (
    get_unread_count as selector_get_unread_count,
    get_recent_notifications,
)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()

        status_filter = request.query_params.get("status")

        notifications = get_recent_notifications(request.user, membership.workspace)

        if status_filter:
            notifications = [n for n in notifications if n.status == status_filter]

        serializer = NotificationSerializer(notifications, many=True)
        unread_count = selector_get_unread_count(request.user, membership.workspace)

        return Response(
            {
                "notifications": serializer.data,
                "unread_count": unread_count,
            }
        )


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def post(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.mark_read()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    def delete(self, request, notification_id):
        notification = get_object_or_404(
            Notification, id=notification_id, recipient=request.user
        )
        notification.status = "archived"
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationBulkMarkReadView(APIView):
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

        updated = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            workspace=membership.workspace,
            status="unread",
        ).update(status="read")

        return Response({"updated_count": updated})


class NotificationPreferenceView(APIView):
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = ChatAuthService(request.user)
        membership = auth.require_workspace_membership()
        count = selector_get_unread_count(request.user, membership.workspace)
        return Response({"unread_count": count})
