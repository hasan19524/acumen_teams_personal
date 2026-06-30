# acumen_backend/announcements/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Exists, OuterRef
from django.utils import timezone

from .models import Announcement, AnnouncementRead, AnnouncementAttachment
from .services import AnnouncementService
from workspaces.models import Workspace, WorkspaceMembership, TeamMembership
from workspaces.permissions import is_team_leader


def ann_data(a, user):
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority,
        "pinned": a.pinned,
        "is_archived": a.is_archived,
        "by": a.created_by.first_name or a.created_by.username,
        "time": a.created_at.strftime("%b %d, %Y"),
        "teams": [{"id": t.id, "name": t.name} for t in a.teams.all()],
        "scope": "team" if a.teams.exists() else "workspace",
        "is_read": a.reads.filter(user=user).exists(),
        "attachment_count": a.attachments.count(),
        "edited": a.is_edited,
    }


from rest_framework.pagination import PageNumberPagination


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_list(request, workspace_id):
    workspace = get_object_or_404(Workspace, id=workspace_id)

    user_team_ids = TeamMembership.objects.filter(
        user=request.user, team__workspace=workspace, is_active=True
    ).values_list("team_id", flat=True)

    is_read_sq = AnnouncementRead.objects.filter(
        announcement=OuterRef("pk"), user=request.user
    )

    items = (
        Announcement.objects.filter(workspace=workspace, is_deleted=False)
        .filter(Q(teams__in=user_team_ids) | Q(teams=None))
        .select_related("created_by")
        .prefetch_related("teams", "reads", "attachments")
        .annotate(is_read=Exists(is_read_sq))
        .distinct()
    )

    # Filter: Archive (Auto-evaluates expiry_date)
    archive_filter = request.query_params.get("filter")
    now = timezone.now()

    if archive_filter == "archive":
        # Show manually archived OR expired announcements
        items = items.filter(Q(is_archived=True) | Q(expiry_date__lte=now))
    else:
        # Show active announcements that are NOT manually archived AND NOT expired
        items = items.filter(is_archived=False).filter(
            Q(expiry_date__gt=now) | Q(expiry_date__isnull=True)
        )

    # Search
    search = request.query_params.get("search")
    if search:
        items = items.filter(
            Q(title__icontains=search)
            | Q(content__icontains=search)
            | Q(created_by__username__icontains=search)
        )

    items = items.order_by("-pinned", "-created_at")

    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(items, request, view=request)
    return paginator.get_paginated_response(
        [{**ann_data(a, request.user), "is_read": a.is_read} for a in page]
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_create(request, workspace_id):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    membership = get_object_or_404(
        WorkspaceMembership, user=request.user, workspace=workspace, is_active=True
    )

    is_admin = membership.role in ("owner", "admin")
    team_ids = request.data.get("team_ids", [])

    if team_ids:
        if not is_admin:
            for tid in team_ids:
                if not is_team_leader(request.user, tid):
                    return Response(
                        {"error": "Leaders can only post to teams they lead"},
                        status=403,
                    )
    else:
        if not is_admin:
            return Response(
                {"error": "Only admins can post workspace announcements"}, status=403
            )

    try:
        ann = AnnouncementService.create_announcement(
            workspace, request.user, request.data
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    return Response(ann_data(ann, request.user), status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def announcement_update(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )

    is_admin = WorkspaceMembership.objects.filter(
        user=request.user,
        workspace_id=workspace_id,
        role__in=["owner", "admin"],
        is_active=True,
    ).exists()
    if ann.created_by != request.user and not is_admin:
        return Response({"error": "Not authorized"}, status=403)

    ann.title = request.data.get("title", ann.title)
    ann.content = request.data.get("content", ann.content)
    ann.priority = request.data.get("priority", ann.priority)
    ann.pinned = request.data.get("pinned", ann.pinned)
    ann.is_edited = True
    ann.save()
    return Response(ann_data(ann, request.user))


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def announcement_toggle_pin(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )

    is_admin = WorkspaceMembership.objects.filter(
        user=request.user,
        workspace_id=workspace_id,
        role__in=["owner", "admin"],
        is_active=True,
    ).exists()
    if ann.created_by != request.user and not is_admin:
        return Response({"error": "Not authorized"}, status=403)

    ann.pinned = not ann.pinned
    ann.save()
    return Response({"pinned": ann.pinned})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def announcement_toggle_archive(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )

    is_admin = WorkspaceMembership.objects.filter(
        user=request.user,
        workspace_id=workspace_id,
        role__in=["owner", "admin"],
        is_active=True,
    ).exists()
    if ann.created_by != request.user and not is_admin:
        return Response({"error": "Not authorized"}, status=403)

    ann.is_archived = not ann.is_archived
    ann.save()
    return Response({"is_archived": ann.is_archived})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def announcement_delete(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )
    is_admin = WorkspaceMembership.objects.filter(
        user=request.user,
        workspace_id=workspace_id,
        role__in=["owner", "admin"],
        is_active=True,
    ).exists()
    if ann.created_by != request.user and not is_admin:
        return Response({"error": "Not authorized"}, status=403)

    AnnouncementService.delete_announcement(ann)
    return Response({"deleted": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_mark_read(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )
    AnnouncementService.mark_as_read(ann, request.user)
    return Response({"read": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_detail(request, workspace_id, pk):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    ann = get_object_or_404(Announcement, pk=pk, workspace=workspace, is_deleted=False)

    user_team_ids = TeamMembership.objects.filter(
        user=request.user, team__workspace=workspace, is_active=True
    ).values_list("team_id", flat=True)

    if ann.teams.exists() and not ann.teams.filter(id__in=user_team_ids).exists():
        if not WorkspaceMembership.objects.filter(
            user=request.user,
            workspace=workspace,
            role__in=["owner", "admin"],
            is_active=True,
        ).exists():
            return Response({"error": "Not authorized"}, status=403)

    data = ann_data(ann, request.user)
    data["attachments"] = [
        {
            "id": att.id,
            "file_name": att.file_name,
            "file_url": request.build_absolute_uri(att.file.url) if att.file else None,
            "file_size": format_file_size(att.file.size) if att.file else None,
        }
        for att in ann.attachments.all()
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_upload_attachments(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )

    is_admin = WorkspaceMembership.objects.filter(
        user=request.user,
        workspace_id=workspace_id,
        role__in=["owner", "admin"],
        is_active=True,
    ).exists()
    if ann.created_by != request.user and not is_admin:
        return Response({"error": "Not authorized"}, status=403)

    files = request.FILES.getlist("files")
    if not files:
        return Response({"error": "No files provided"}, status=400)

    created_attachments = []
    for file_obj in files:
        att = AnnouncementAttachment.objects.create(
            announcement=ann,
            file=file_obj,
            file_name=file_obj.name,
            uploaded_by=request.user,
        )
        created_attachments.append(
            {
                "id": att.id,
                "file_name": att.file_name,
                "file_url": request.build_absolute_uri(att.file.url),
                "file_size": format_file_size(att.file.size),
            }
        )

    return Response({"attachments": created_attachments}, status=201)


def format_file_size(size):
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    else:
        return f"{size / (1024 * 1024):.1f} MB"
