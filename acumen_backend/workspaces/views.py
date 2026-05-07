from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Workspace, Team, UserProfile


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_workspace(request):
    try:
        profile = request.user.profile
        workspace = profile.workspace
        if not workspace:
            return Response({"error": "No workspace found"}, status=404)
        return Response(
            {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug,
                "owner": workspace.owner.username,
            }
        )
    except:
        return Response({"error": "No profile found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_team(request):
    try:
        profile = request.user.profile
        team = profile.team
        if not team:
            return Response({"team": None})
        members = UserProfile.objects.filter(team=team)
        return Response(
            {
                "id": team.id,
                "name": team.name,
                "leader": team.leader.username if team.leader else None,
                "members": [
                    {
                        "user_id": m.user.id,
                        "username": m.user.username,
                        "full_name": m.full_name or m.user.username,
                        "role": m.role,
                    }
                    for m in members
                ],
            }
        )
    except:
        return Response({"team": None})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_teams(request):
    try:
        profile = request.user.profile
        if profile.role not in ["admin", "leader"]:
            return Response({"error": "Not authorized"}, status=403)
        workspace = profile.workspace
        teams = Team.objects.filter(workspace=workspace)
        return Response(
            [
                {
                    "id": t.id,
                    "name": t.name,
                    "leader": t.leader.username if t.leader else None,
                    "member_count": UserProfile.objects.filter(team=t).count(),
                }
                for t in teams
            ]
        )
    except:
        return Response([])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_members(request):
    try:
        profile = request.user.profile
        if profile.role != "admin":
            return Response({"error": "Not authorized"}, status=403)
        workspace = profile.workspace
        members = UserProfile.objects.filter(workspace=workspace)
        return Response(
            [
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": m.full_name or m.user.username,
                    "role": m.role,
                    "team": m.team.name if m.team else None,
                }
                for m in members
            ]
        )
    except:
        return Response([])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        profile = request.user.profile
        workspace = profile.workspace
        total_members = UserProfile.objects.filter(workspace=workspace).count()
        total_teams = Team.objects.filter(workspace=workspace).count()
        return Response(
            {
                "total_members": total_members,
                "total_teams": total_teams,
                "role": profile.role,
            }
        )
    except:
        return Response(
            {
                "total_members": 0,
                "total_teams": 0,
                "role": "employee",
            }
        )
