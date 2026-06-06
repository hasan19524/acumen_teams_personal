from rest_framework.permissions import BasePermission


class IsNotificationOwner(BasePermission):
    """Only allow users to view/modify their own notifications."""

    def has_object_permission(self, request, view, obj):
        return obj.recipient == request.user
