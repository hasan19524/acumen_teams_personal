# workspaces/permissions.py

from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from .models import WorkspaceMembership


def get_membership(user, workspace):
    """Returns WorkspaceMembership or None."""
    try:
        return WorkspaceMembership.objects.get(
            user=user, workspace=workspace, is_active=True
        )
    except WorkspaceMembership.DoesNotExist:
        return None


class IsWorkspaceMember(BasePermission):
    """User must be an active member of the workspace."""

    message = "You are not a member of this workspace."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        workspace = getattr(view, "get_workspace", lambda: None)()
        if not workspace:
            return True  # Let view handle it
        return WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).exists()


class HasWorkspacePermission(BasePermission):
    """
    Usage: set required_permission on the view.
    Example:
        class MyView(APIView):
            required_permission = 'create_channels'
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required = getattr(view, "required_permission", None)
        if not required:
            return True

        # Try to get workspace from view
        workspace = None
        get_ws = getattr(view, "get_workspace", None)
        if get_ws:
            workspace = get_ws()

        if not workspace:
            # Try from user profile for backward compat
            try:
                membership = request.user.memberships.filter(is_active=True).first()
                if not membership:
                    return False
                return membership.can(required)
            except Exception:
                return False

        membership = get_membership(request.user, workspace)
        if not membership:
            return False
        return membership.can(required)


def require_permission(permission: str):
    """
    Decorator for DRF views.
    Usage:
        @require_permission('post_announcements')
        def post(self, request):
            ...
    """

    def decorator(func):
        def wrapper(self, request, *args, **kwargs):
            try:
                membership = request.user.memberships.filter(is_active=True).first()
            except Exception:
                raise PermissionDenied("No workspace membership found.")
            if not membership or not membership.can(permission):
                raise PermissionDenied(
                    f"Your role '{getattr(membership, 'role', 'unknown')}' "
                    f"does not have '{permission}' permission."
                )
            return func(self, request, *args, **kwargs)

        wrapper.__name__ = func.__name__
        return wrapper

    return decorator


def is_team_leader(user, team_id: int) -> bool:
    """
    Check if a user is an active leader of a specific team.
    Used for team-scoped operations (announcements, tasks, member management).
    """
    from .models import TeamMembership
    return TeamMembership.objects.filter(
        user=user,
        team_id=team_id,
        is_active=True,
        is_leader=True,
    ).exists()


def get_led_team_ids(user) -> list[int]:
    """
    Returns list of team IDs where the user is an active leader.
    Used for filtering queries (e.g., "show me teams I can manage").
    """
    from .models import TeamMembership
    return list(
        TeamMembership.objects.filter(
            user=user,
            is_active=True,
            is_leader=True,
        ).values_list("team_id", flat=True)
    )
