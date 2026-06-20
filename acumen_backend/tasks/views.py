from typing import Any, Dict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import Throttled
from django.db.models import Q, Subquery, IntegerField, Count, OuterRef
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

from .models import Task, TaskActivity, TaskMember, TaskComment, TaskAttachment
from .serializers import (
    TaskSerializer,
    TaskListSerializer,
    UserMiniSerializer,
    TaskMemberSerializer,
    TaskCommentSerializer,
    TaskAttachmentSerializer,
)
from .permissions import (
    can_assign_to_user,
    can_assign_to_team,
    can_view_task,
    can_edit_task,
    can_archive_task,
    can_approve_task,
    get_workspace_role,
)
from .services import TaskService
from workspaces.models import Workspace, WorkspaceMembership, TeamMembership, Team


# Helper to enforce workspace context
def get_workspace(request: Request, workspace_id: int) -> Workspace:
    return get_object_or_404(Workspace, id=workspace_id)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_list(request: Request, workspace_id: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    user_role = get_workspace_role(request.user, workspace)

    user_teams = TeamMembership.objects.filter(
        user_id=request.user.id, is_active=True, team__workspace=workspace
    ).values_list("team_id", flat=True)

    # 1. Build ORM visibility query (replaces Python loop)
    visibility_q = (
        Q(created_by_id=request.user.id)
        | Q(assigned_to_id=request.user.id)
        | Q(task_type="team", team_id__in=user_teams)
    )

    # Owners/Admins can see all assigned/team tasks
    if user_role in ("owner", "admin"):
        visibility_q |= Q(task_type__in=["assigned", "team"])

    tasks = (
        Task.objects.filter(is_archived=False, is_deleted=False, workspace=workspace)
        .filter(visibility_q)
        .distinct()
    )

    # 2. Apply filters at DB level
    filter_param = request.query_params.get("filter")
    if filter_param == "todo":
        tasks = tasks.filter(status="todo")
    elif filter_param == "in_progress":
        tasks = tasks.filter(status="in_progress")
    elif filter_param == "completed":
        tasks = tasks.filter(status="completed")
    elif filter_param == "overdue":
        tasks = tasks.filter(
            due_date__lt=timezone.now(), status__in=["todo", "in_progress"]
        )
    elif filter_param == "high_priority":
        tasks = tasks.filter(priority__in=["high", "critical"])

    # 3. Annotate counts using Subqueries (kills N+1 queries)
    comments_sq = (
        TaskComment.objects.filter(task=OuterRef("pk"), is_deleted=False)
        .order_by()
        .values("task")
        .annotate(c=Count("pk"))
        .values("c")
    )
    attachments_sq = (
        TaskAttachment.objects.filter(task=OuterRef("pk"), is_deleted=False)
        .order_by()
        .values("task")
        .annotate(c=Count("pk"))
        .values("c")
    )

    tasks = (
        tasks.annotate(
            comment_count=Coalesce(
                Subquery(comments_sq, output_field=IntegerField()), 0
            ),
            attachment_count=Coalesce(
                Subquery(attachments_sq, output_field=IntegerField()), 0
            ),
        )
        .select_related("created_by", "assigned_to", "team")
        .order_by("-created_at")
    )

    # 4. Paginate at DB level
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(tasks, request, view=request)

    serializer = TaskListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_detail(request: Request, workspace_id: int, pk: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    # OPTIMIZATION: Deep prefetch for the detail drawer
    task = get_object_or_404(
        Task.objects.select_related(
            "created_by", "assigned_to", "completed_by", "approved_by", "team"
        ).prefetch_related(
            "comments__author",
            "attachments__uploaded_by",
            "activities__performed_by",
            "members__user",
        ),
        pk=pk,
        workspace=workspace,
        is_deleted=False,
    )

    if not can_view_task(request.user, task):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    serializer = TaskSerializer(task)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def task_create(request: Request, workspace_id: int) -> Response:
    # Add throttle instance for creation
    throttle = ScopedRateThrottle()
    throttle.scope = "create"
    if not throttle.allow_request(request, view=request):
        raise Throttled(detail="Too many tasks created. Please slow down.")

    workspace = get_workspace(request, workspace_id)

    # Ensure user is a member of this workspace
    if not WorkspaceMembership.objects.filter(
        user_id=request.user.id, workspace=workspace, is_active=True
    ).exists():
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    title = (request.data.get("title") or "").strip()
    if not title:
        return Response({"error": "Title required"}, status=status.HTTP_400_BAD_REQUEST)

    task_type = request.data.get("task_type", "personal")
    if task_type not in ("personal", "assigned", "team"):
        return Response(
            {"error": "Invalid task_type"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Permission checks
    if task_type == "assigned":
        assigned_to_id = request.data.get("assigned_to")
        if not assigned_to_id:
            return Response(
                {"error": "assigned_to is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            assigned_to_user = User.objects.get(id=assigned_to_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_assign_to_user(request.user, assigned_to_user, workspace):
            return Response(
                {"error": "You lack authority to assign to this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

    elif task_type == "team":
        team_id = request.data.get("team_id")
        if not team_id:
            return Response(
                {"error": "team_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_assign_to_team(request.user, team):
            return Response(
                {"error": "You lack authority to assign to this team"},
                status=status.HTTP_403_FORBIDDEN,
            )

    try:
        task = TaskService.create_task(workspace, request.user, request.data)
    except ValidationError as e:
        return Response(
            e.message_dict if hasattr(e, "message_dict") else {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_update(request: Request, workspace_id: int, pk: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    task = get_object_or_404(Task, pk=pk, workspace=workspace, is_deleted=False)

    if not can_view_task(request.user, task):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    try:
        task = TaskService.update_task(task, request.user, request.data)
    except ValidationError as e:
        return Response(
            e.message_dict if hasattr(e, "message_dict") else {"error": str(e)},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(TaskSerializer(task).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_archive(request: Request, workspace_id: int, pk: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    task = get_object_or_404(Task, pk=pk, workspace=workspace, is_deleted=False)

    if not can_archive_task(request.user, task):
        return Response(
            {"error": "Only creator/admin can archive tasks"},
            status=status.HTTP_403_FORBIDDEN,
        )

    task = TaskService.archive_task(task, request.user)
    return Response({"archived": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_members(request: Request, workspace_id: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    members = WorkspaceMembership.objects.filter(
        workspace=workspace, is_active=True
    ).select_related("user")
    users = [m.user for m in members]
    serializer = UserMiniSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def team_members(request: Request, workspace_id: int, team_id: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    team = get_object_or_404(Team, id=team_id, workspace=workspace)
    members = TeamMembership.objects.filter(team=team, is_active=True).select_related(
        "user"
    )
    users = [m.user for m in members]
    serializer = UserMiniSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_member_update_status(request: Request, workspace_id: int, pk: int) -> Response:
    participant = get_object_or_404(
        TaskMember, pk=pk, user_id=request.user.id, task__workspace_id=workspace_id
    )

    new_status = request.data.get("status")
    try:
        participant = TaskService.update_member_status(
            participant, request.user, new_status
        )
    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(TaskSerializer(participant.task).data)


# ── COMMENTS & ATTACHMENTS ──────────────────────────────────────────


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_comments_list_create(
    request: Request, workspace_id: int, task_id: int
) -> Response:
    task = get_object_or_404(
        Task, pk=task_id, workspace_id=workspace_id, is_deleted=False
    )

    if not can_view_task(request.user, task):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        comments = task.comments.filter(is_deleted=False)
        serializer = TaskCommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response(
                {"error": "Message required"}, status=status.HTTP_400_BAD_REQUEST
            )

        TaskService.add_comment(task, request.user, message)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_comment_update_delete(
    request: Request, workspace_id: int, pk: int
) -> Response:
    comment = get_object_or_404(
        TaskComment, pk=pk, task__workspace_id=workspace_id, is_deleted=False
    )

    if comment.author != request.user:
        return Response(
            {"error": "Only author can modify comment"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "PATCH":
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response(
                {"error": "Message required"}, status=status.HTTP_400_BAD_REQUEST
            )
        TaskService.update_comment(comment, request.user, message)
        return Response(TaskSerializer(comment.task).data)

    elif request.method == "DELETE":
        TaskService.delete_comment(comment, request.user)
        return Response(TaskSerializer(comment.task).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_attachments_list_create(
    request: Request, workspace_id: int, task_id: int
) -> Response:
    task = get_object_or_404(
        Task, pk=task_id, workspace_id=workspace_id, is_deleted=False
    )

    if not can_view_task(request.user, task):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        attachments = task.attachments.filter(is_deleted=False)
        serializer = TaskAttachmentSerializer(
            attachments, many=True, context={"request": request}
        )
        return Response(serializer.data)

    elif request.method == "POST":
        file_obj = request.FILES.get("file")
        file_name = request.data.get("file_name", file_obj.name if file_obj else "")

        if not file_obj:
            return Response(
                {"error": "File required"}, status=status.HTTP_400_BAD_REQUEST
            )

        TaskService.add_attachment(task, request.user, file_obj, file_name)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def task_attachment_delete(request: Request, workspace_id: int, pk: int) -> Response:
    attachment = get_object_or_404(
        TaskAttachment, pk=pk, task__workspace_id=workspace_id, is_deleted=False
    )

    if (
        attachment.uploaded_by != request.user
        and attachment.task.created_by != request.user
    ):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    TaskService.delete_attachment(attachment, request.user)
    return Response(TaskSerializer(attachment.task).data)


# ── APPROVAL & ANALYTICS ──────────────────────────────────────────


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_approve(request: Request, workspace_id: int, pk: int) -> Response:
    task = get_object_or_404(Task, pk=pk, workspace_id=workspace_id, is_deleted=False)

    if not can_approve_task(request.user, task):
        return Response(
            {"error": "Not authorized to approve this task"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        task = TaskService.approve_task(task, request.user)
    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(TaskSerializer(task).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_reject(request: Request, workspace_id: int, pk: int) -> Response:
    task = get_object_or_404(Task, pk=pk, workspace_id=workspace_id, is_deleted=False)

    if not can_approve_task(request.user, task):
        return Response(
            {"error": "Not authorized to reject this task"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        task = TaskService.reject_task(task, request.user)
    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(TaskSerializer(task).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_analytics(request: Request, workspace_id: int) -> Response:
    workspace = get_workspace(request, workspace_id)
    membership = get_object_or_404(
        WorkspaceMembership,
        user_id=request.user.id,
        workspace=workspace,
        is_active=True,
    )
    role = membership.role

    base_qs = Task.objects.filter(
        workspace=workspace, is_archived=False, is_deleted=False
    )

    data: Dict[str, Any] = {}

    if role in ("owner", "admin"):
        total_tasks = base_qs.count()
        completed_tasks = base_qs.filter(status="completed").count()
        score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

        data["total_tasks"] = total_tasks
        data["completed"] = completed_tasks
        data["productivity_score"] = round(score, 1)
        data["pending_approval"] = base_qs.filter(status="pending_approval").count()
        data["overdue"] = base_qs.filter(
            due_date__lt=timezone.now(), status__in=["todo", "in_progress"]
        ).count()

    elif role == "leader":
        led_team_ids = list(
            TeamMembership.objects.filter(
                user_id=request.user.id, is_active=True, is_leader=True
            ).values_list("team_id", flat=True)
        )

        if led_team_ids:
            team_qs = base_qs.filter(team_id__in=led_team_ids)
            total_tasks = team_qs.count()
            completed_tasks = team_qs.filter(status="completed").count()
            score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

            data["team_tasks"] = total_tasks
            data["team_completed"] = completed_tasks
            data["productivity_score"] = round(score, 1)
            data["team_overdue"] = team_qs.filter(
                due_date__lt=timezone.now(), status__in=["todo", "in_progress"]
            ).count()
            data["pending_approval"] = team_qs.filter(status="pending_approval").count()

    else:  # Member
        my_qs = base_qs.filter(
            Q(created_by_id=request.user.id) | Q(assigned_to_id=request.user.id)
        )
        total_tasks = my_qs.count()
        completed_tasks = my_qs.filter(status="completed").count()
        score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

        data["my_tasks"] = total_tasks
        data["my_completed"] = completed_tasks
        data["productivity_score"] = round(score, 1)
        data["my_overdue"] = my_qs.filter(
            due_date__lt=timezone.now(), status__in=["todo", "in_progress"]
        ).count()

    return Response(data)
