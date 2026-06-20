# acumen_backend/announcements/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Exists, OuterRef

from .models import Announcement, AnnouncementRead
from .services import AnnouncementService
from workspaces.models import Workspace, WorkspaceMembership, TeamMembership
from workspaces.permissions import is_team_leader


def ann_data(a, user):
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "tag": a.tag,
        "priority": a.priority,
        "pinned": a.pinned,
        "by": a.created_by.first_name or a.created_by.username,
        "time": a.created_at.strftime("%b %d, %Y"),
        "team_id": a.team_id,
        "team_name": a.team.name if a.team else None,
        "scope": "team" if a.team else "workspace",
        "is_read": a.reads.filter(user=user).exists(),
    }


from rest_framework.pagination import PageNumberPagination


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_list(request, workspace_id):
    workspace = get_object_or_404(Workspace, id=workspace_id)

    user_team_ids = TeamMembership.objects.filter(
        user=request.user, team__workspace=workspace, is_active=True
    ).values_list("team_id", flat=True)

    # OPTIMIZATION: Annotate is_read to kill N+1 queries in the loop
    is_read_sq = AnnouncementRead.objects.filter(
        announcement=OuterRef("pk"), user=request.user
    )

    items = (
        Announcement.objects.filter(workspace=workspace, is_deleted=False)
        .filter(Q(team_id__in=user_team_ids) | Q(team=None))
        .select_related("created_by", "team")
        .annotate(is_read=Exists(is_read_sq))
        .order_by("-pinned", "-created_at")
    )

    # Paginate at DB level
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(items, request, view=request)

    # Pass the annotated `is_read` boolean to the dict builder
    return paginator.get_paginated_response(
        [
            {
                **ann_data(a, request.user),
                "is_read": a.is_read,  # Use the annotated value directly
            }
            for a in page
        ]
    )


from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import Throttled

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_create(request, workspace_id):
    # Add throttle instance for creation
    throttle = ScopedRateThrottle()
    throttle.scope = 'create'
    if not throttle.allow_request(request, view=request):
        raise Throttled(detail="Too many announcements created. Please slow down.")
    workspace = get_object_or_404(Workspace, id=workspace_id)

    membership = get_object_or_404(
        WorkspaceMembership, user=request.user, workspace=workspace, is_active=True
    )
    is_admin = membership.role in ("owner", "admin")
    team_id = request.data.get("team_id")

    if team_id:
        if not is_admin and not is_team_leader(request.user, team_id):
            return Response(
                {"error": "Only admins or team leaders can post team announcements"},
                status=403,
            )
    else:
        if not is_admin:
            return Response(
                {"error": "Only admins can post workspace announcements"},
                status=403,
            )

    try:
        ann = AnnouncementService.create_announcement(
            workspace, request.user, request.data
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception:
        return Response({"error": "Team not found"}, status=404)

    return Response(ann_data(ann, request.user), status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def announcement_delete(request, workspace_id, pk):
    ann = get_object_or_404(
        Announcement, pk=pk, workspace_id=workspace_id, is_deleted=False
    )

    if ann.created_by != request.user:
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace_id=workspace_id, is_active=True
        ).first()
        if not membership or membership.role not in ("owner", "admin"):
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
