from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Task


def task_data(t):
    return {
        "id": t.id,
        "title": t.title,
        "assignee": t.assignee_name,
        "priority": t.priority,
        "status": t.status,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_list(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        workspace = membership.workspace if membership else None
        tasks = Task.objects.filter(workspace=workspace)
    except:
        tasks = Task.objects.filter(created_by=request.user)
    return Response([task_data(t) for t in tasks])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def task_create(request):
    title = (request.data.get("title") or "").strip()
    if not title:
        return Response({"error": "Title required"}, status=400)
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        workspace = membership.workspace if membership else None
    except:
        workspace = None
    task = Task.objects.create(
        title=title,
        assignee_name=request.data.get("assignee", "You"),
        priority=request.data.get("priority", "Medium"),
        status=request.data.get("status", "todo"),
        created_by=request.user,
        workspace=workspace,
    )
    return Response(task_data(task), status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def task_update(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
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
        Task.objects.get(pk=pk, created_by=request.user).delete()
    except Task.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    return Response({"deleted": True})
