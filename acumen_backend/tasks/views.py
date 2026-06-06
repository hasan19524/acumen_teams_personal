from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Task
from notifications.services import NotificationService, TaskAssignedEvent
from workspaces.models import TeamMembership, Team, WorkspaceMembership
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)


def task_data(t):
    return {
        "id": t.id,
        "task_type": t.task_type,
        "title": t.title,
        "assignee": t.assignee_name,
        "priority": t.priority,
        "status": t.status,
        "team_id": t.team_id,
        "team_name": t.team.name if t.team else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_list(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        workspace = membership.workspace if membership else None

        # Personal tasks: always visible to creator only
        personal_tasks = Task.objects.filter(
            created_by=request.user,
            task_type="personal",
        )

        # Team tasks: visible to active team members
        user_team_ids = TeamMembership.objects.filter(
            user=request.user, is_active=True
        ).values_list("team_id", flat=True)

        team_tasks = Task.objects.filter(
            workspace=workspace,
            task_type="team",
            team_id__in=user_team_ids,
        )

        tasks = (personal_tasks | team_tasks).distinct().order_by("-created_at")
    except:
        tasks = Task.objects.filter(created_by=request.user)
    return Response([task_data(t) for t in tasks])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def task_create(request):
    title = (request.data.get("title") or "").strip()
    if not title:
        return Response({"error": "Title required"}, status=400)

    task_type = request.data.get("task_type", "personal")
    if task_type not in ("personal", "team"):
        return Response({"error": "task_type must be 'personal' or 'team'"}, status=400)

    try:
        membership = request.user.memberships.filter(is_active=True).first()
        workspace = membership.workspace if membership else None
    except:
        workspace = None

    if task_type == "personal":
        # Personal task: no team, no notifications, no permission checks
        task = Task.objects.create(
            title=title,
            task_type="personal",
            assignee_name=request.data.get("assignee", "You"),
            priority=request.data.get("priority", "Medium"),
            status=request.data.get("status", "todo"),
            created_by=request.user,
            workspace=workspace,
            team=None,
        )
        return Response(task_data(task), status=201)

    # ── Team task ──────────────────────────────────────────────────────
    team_id = request.data.get("team_id")
    if not team_id:
        return Response({"error": "team_id is required for team tasks"}, status=400)

    if not workspace:
        return Response({"error": "Workspace membership required for team tasks"}, status=400)

    team = None
    try:
        team = Team.objects.get(id=team_id, workspace=workspace)
    except Team.DoesNotExist:
        return Response({"error": "Team not found"}, status=404)

    # Permission: admin OR team leader
    is_admin = membership.role in ("owner", "admin")
    is_leader = TeamMembership.objects.filter(
        user=request.user, team=team, is_active=True, is_leader=True
    ).exists()

    if not is_admin and not is_leader:
        return Response(
            {"error": "Only admins or team leaders can create team tasks"},
            status=403,
        )

    task = Task.objects.create(
        title=title,
        task_type="team",
        assignee_name=request.data.get("assignee", "You"),
        priority=request.data.get("priority", "Medium"),
        status=request.data.get("status", "todo"),
        created_by=request.user,
        workspace=workspace,
        team=team,
    )

    # Notify assignee if we can resolve them to a user (team tasks only)
    assignee_name = request.data.get("assignee", "")
    if assignee_name and workspace:
        try:
            assignee_user = User.objects.filter(
                username=assignee_name
            ).first() or User.objects.filter(
                first_name__iexact=assignee_name
            ).first()
            if assignee_user:
                NotificationService.create_and_emit(
                    TaskAssignedEvent(
                        actor_id=request.user.id,
                        workspace_id=workspace.id,
                        task_id=task.id,
                        task_title=task.title,
                        assignee_ids=[assignee_user.id],
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to emit TaskAssignedEvent: {e}")

    return Response(task_data(task), status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_update(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    # Permission check
    if task.task_type == "personal":
        if task.created_by != request.user:
            return Response({"error": "Not authorized"}, status=403)
    elif task.task_type == "team":
        if task.created_by != request.user:
            membership = request.user.memberships.filter(is_active=True).first()
            if not membership:
                return Response({"error": "Not authorized"}, status=403)
            is_admin = membership.role in ("owner", "admin")
            is_leader = TeamMembership.objects.filter(
                user=request.user, team=task.team, is_active=True, is_leader=True
            ).exists()
            if not is_admin and not is_leader:
                return Response({"error": "Not authorized"}, status=403)

    if "status" in request.data:
        task.status = request.data["status"]
    if "priority" in request.data:
        task.priority = request.data["priority"]
    if "title" in request.data:
        task.title = request.data["title"]
    task.save()
    return Response(task_data(task))


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def task_delete(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    # Permission check
    if task.task_type == "personal":
        if task.created_by != request.user:
            return Response({"error": "Not authorized"}, status=403)
    elif task.task_type == "team":
        if task.created_by != request.user:
            membership = request.user.memberships.filter(is_active=True).first()
            if not membership:
                return Response({"error": "Not authorized"}, status=403)
            is_admin = membership.role in ("owner", "admin")
            is_leader = TeamMembership.objects.filter(
                user=request.user, team=task.team, is_active=True, is_leader=True
            ).exists()
            if not is_admin and not is_leader:
                return Response({"error": "Not authorized"}, status=403)

    task.delete()
    return Response({"deleted": True})
