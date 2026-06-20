# acumen_backend/workspaces/permissions.py
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from .models import WorkspaceMembership


def get_membership(user, workspace):
    try:
        return WorkspaceMembership.objects.get(
            user=user, workspace=workspace, is_active=True
        )
    except WorkspaceMembership.DoesNotExist:
        return None


class IsWorkspaceMember(BasePermission):
    message = "You are not an active member of this workspace."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        workspace = getattr(view, "get_workspace", lambda: None)()
        if not workspace:
            return True
        return WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).exists()


class HasWorkspacePermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        required = getattr(view, "required_permission", None)
        if not required:
            return True

        workspace = None
        get_ws = getattr(view, "get_workspace", None)
        if get_ws:
            workspace = get_ws()

        if not workspace:
            return False  # Hard fail if workspace context is missing

        membership = get_membership(request.user, workspace)
        if not membership:
            return False
        return membership.can(required)


def is_team_leader(user, team_id: int) -> bool:
    from .models import TeamMembership

    return TeamMembership.objects.filter(
        user=user, team_id=team_id, is_active=True, is_leader=True
    ).exists()


def get_led_team_ids(user) -> list[int]:
    from .models import TeamMembership

    return list(
        TeamMembership.objects.filter(
            user=user, is_active=True, is_leader=True
        ).values_list("team_id", flat=True)
    )
