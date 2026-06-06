from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Announcement
from notifications.services import NotificationService, AnnouncementEvent
from workspaces.models import WorkspaceMembership, Team, TeamMembership
from workspaces.permissions import is_team_leader
import logging

logger = logging.getLogger(__name__)


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
        "team_id": a.team_id,
        "team_name": a.team.name if a.team else None,
        "scope": "team" if a.team else "workspace",
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def announcement_list(request):
    try:
        membership = request.user.memberships.filter(is_active=True).first()
        workspace = membership.workspace if membership else None
        
        # Show workspace-wide announcements + announcements for user's teams
        user_team_ids = TeamMembership.objects.filter(
            user=request.user, is_active=True
        ).values_list("team_id", flat=True)
        
        items = Announcement.objects.filter(workspace=workspace).filter(
            Q(team_id__in=user_team_ids) | Q(team=None)
        )
    except:
        items = Announcement.objects.filter(created_by=request.user)
    return Response([ann_data(a) for a in items])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def announcement_create(request):
    membership = request.user.memberships.filter(is_active=True).first()
    if not membership:
        return Response({"error": "No workspace found"}, status=400)

    workspace = membership.workspace
    is_admin = membership.role in ("owner", "admin")
    team_id = request.data.get("team_id")
    team = None

    # Resolve team if provided
    if team_id:
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=404)

    # Permission checks per locked rules:
    # - Admins can post workspace + team announcements
    # - Team leaders can post team announcements ONLY
    # - Employees/guests cannot post
    if team:
        # Team announcement: admin OR leader of this team
        if not is_admin and not is_team_leader(request.user, team.id):
            return Response(
                {"error": "Only admins or team leaders can post team announcements"},
                status=403,
            )
    else:
        # Workspace announcement: admin only
        if not is_admin:
            return Response(
                {"error": "Only admins can post workspace announcements"},
                status=403,
            )

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
        team=team,
    )

    # Route notifications to correct recipients
    try:
        if team:
            # Notify team members only
            member_ids = list(
                TeamMembership.objects.filter(
                    team=team, is_active=True
                ).values_list("user_id", flat=True)
            )
        else:
            # Notify all workspace members
            member_ids = list(
                WorkspaceMembership.objects.filter(
                    workspace=workspace, is_active=True
                ).values_list("user_id", flat=True)
            )
        
        NotificationService.create_and_emit(
            AnnouncementEvent(
                actor_id=request.user.id,
                workspace_id=workspace.id,
                announcement_id=ann.id,
                announcement_title=title,
                recipient_ids=member_ids,
            )
        )
    except Exception as e:
        logger.warning(f"Failed to emit AnnouncementEvent: {e}")

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
