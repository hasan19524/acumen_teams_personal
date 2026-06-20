# acumen_backend/tasks/permissions.py
from workspaces.models import WorkspaceMembership, TeamMembership, Team
from workspaces.permissions import is_team_leader


def get_workspace_role(user, workspace):
    try:
        return WorkspaceMembership.objects.get(
            user=user, workspace=workspace, is_active=True
        ).role
    except WorkspaceMembership.DoesNotExist:
        return None


def can_assign_to_user(assigner, target_user, workspace):
    assigner_role = get_workspace_role(assigner, workspace)
    if not assigner_role:
        return False

    # Owners and Admins can assign to anyone
    if assigner_role in ("owner", "admin"):
        return True

    # Team Leaders can assign to members of their own team
    led_team_ids = TeamMembership.objects.filter(
        user=assigner, is_active=True, is_leader=True
    ).values_list("team_id", flat=True)

    return TeamMembership.objects.filter(
        user=target_user, team_id__in=led_team_ids, is_active=True
    ).exists()


def can_assign_to_team(assigner, team):
    assigner_role = get_workspace_role(assigner, team.workspace)

    if assigner_role in ("owner", "admin"):
        return True

    if is_team_leader(assigner, team.id):
        return True

    return False


def can_view_task(user, task):
    if task.created_by == user:
        return True

    if task.task_type == "personal":
        return False

    if task.assigned_to == user:
        return True

    if task.task_type == "team" and task.team:
        if TeamMembership.objects.filter(
            user=user, team=task.team, is_active=True
        ).exists():
            return True

    role = get_workspace_role(user, task.workspace)
    if role in ("owner", "admin") and task.task_type in ("assigned", "team"):
        return True

    return False


def can_edit_task(user, task):
    if task.created_by == user:
        return True

    role = get_workspace_role(user, task.workspace)
    if role in ("owner", "admin"):
        return True

    if task.team and is_team_leader(user, task.team.id):
        return True

    return False


def can_archive_task(user, task):
    return can_edit_task(user, task)


def can_approve_task(user, task):
    if not task.requires_approval:
        return False

    role = get_workspace_role(user, task.workspace)
    if role in ("owner", "admin"):
        return True

    # FIX: Use task.team_id, not task.id
    if task.team_id and is_team_leader(user, task.team_id):
        return True

    # Creator of assigned task can approve
    if task.created_by == user and task.assigned_to != user:
        return True

    return False
