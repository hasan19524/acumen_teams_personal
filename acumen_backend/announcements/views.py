from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Announcement


def ann_data(a):
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "tag": a.tag,
        "priority": a.priority,
        "pinned": a.pinned,
        "by": a.created_by.first_name or a.created_by.username,
        "time": a.created_at.strftime("%b %d, %Y"),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_list(request):
    try:
        workspace = request.user.profile.workspace
        items = Announcement.objects.filter(workspace=workspace)
    except:
        items = Announcement.objects.filter(created_by=request.user)
    return Response([ann_data(a) for a in items])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_create(request):
    try:
        profile = request.user.profile
        if profile.role not in ["admin", "leader"]:
            return Response(
                {"error": "Only admins and team leaders can post announcements"},
                status=403,
            )
        workspace = profile.workspace
    except:
        workspace = None

    title = (request.data.get("title") or "").strip()
    content = (request.data.get("content") or "").strip()
    if not title or not content:
        return Response({"error": "Title and content required"}, status=400)

    ann = Announcement.objects.create(
        title=title,
        content=content,
        tag=request.data.get("tag", "General"),
        priority=request.data.get("priority", "Normal"),
        pinned=request.data.get("pinned", False),
        created_by=request.user,
        workspace=workspace,
    )
    return Response(ann_data(ann), status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def announcement_delete(request, pk):
    try:
        ann = Announcement.objects.get(pk=pk, created_by=request.user)
        ann.delete()
    except Announcement.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    return Response({"deleted": True})
