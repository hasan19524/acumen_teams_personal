from rest_framework import permissions


class IsuserOrReadOnly(permissions.BasePermission):
    """
    Permission to check if the user is the user of the object.
    Only users can update or delete their own notes and notebooks.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if the user is the user of the note or notebook."""
        return obj.user == request.user


class Isuser(permissions.BasePermission):
    """
    Permission to check if the user is the user of the object.
    Only users can view, update, or delete their own notes and notebooks.
    No read-only access for non-users.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if the user is the user of the note or notebook."""
        return obj.user == request.user