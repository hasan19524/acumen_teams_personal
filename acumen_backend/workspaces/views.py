# acumen_backend/workspaces/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from tasks.models import Task
from attendance.models import Attendance
    

from django.utils import timezone
from datetime import timedelta
from django.db import models

from .models import (
    Workspace,
    Team,
    WorkspaceMembership,
    WorkspaceInvite,
    TeamMembership,
    TeamInvite,
    PrivateGroupInvite,
    ROLE_PERMISSIONS,
    TeamType,
)
from .permissions import IsWorkspaceMember, HasWorkspacePermission, is_team_leader
from .services import WorkspaceService, TeamService
from accounts.models import validate_image_file
from notifications.services import NotificationService, WorkspaceEvent
import logging

logger = logging.getLogger(__name__)


class WorkspaceBaseView(APIView):
    """Base view to enforce explicit workspace context resolution from URL."""

    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_workspace(self):
        workspace_id = self.kwargs.get("workspace_id")
        if not workspace_id:
            return None
        return get_object_or_404(Workspace, id=workspace_id)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_workspace(request, workspace_id):
    workspace = get_object_or_404(Workspace, id=workspace_id)
    return Response(
        {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "owner": workspace.owner.username,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_team(request, workspace_id):
    team_membership = (
        TeamMembership.objects.filter(
            user=request.user, team__workspace_id=workspace_id, is_active=True
        )
        .select_related("team")
        .first()
    )
    if not team_membership:
        return Response({"team": None})

    team = team_membership.team
    members = TeamMembership.objects.filter(team=team, is_active=True).select_related(
        "user"
    )
    return Response(
        {
            "id": team.id,
            "name": team.name,
            "leaders": list(
                TeamMembership.objects.filter(
                    team=team, is_active=True, is_leader=True
                ).values_list("user__username", flat=True)
            ),
            "members": [
                {
                    "user_id": m.user.id,
                    "username": m.user.username,
                    "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                    or m.user.username,
                    "role": WorkspaceMembership.objects.filter(
                        user=m.user, workspace_id=workspace_id, is_active=True
                    )
                    .values_list("role", flat=True)
                    .first()
                    or "member",
                    "is_leader": m.is_leader,
                }
                for m in members
            ],
        }
    )


from django.db.models import Q


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_teams(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"error": "Not authorized"}, status=403)

    # Exclude only "General" from the Teams grid (it's a workspace channel, not an org team).
    # "Unassigned" IS shown because it's an organizational system team.
    base_qs = Team.objects.filter(workspace_id=workspace_id).exclude(
        team_type=TeamType.GENERAL
    ).exclude(name__iexact="General")
    # FIX: Any workspace member can see all teams and their members.
    teams = base_qs

    # Get all active workspace user IDs to ensure we don't count "ghost" members 
    # (users who were removed from the workspace but still have team records)
    active_workspace_user_ids = WorkspaceMembership.objects.filter(
        workspace_id=workspace_id, is_active=True
    ).values_list("user_id", flat=True)

    response_data = []
    for t in teams:
        # Only consider memberships where the user is an active member of the workspace
        valid_memberships = TeamMembership.objects.filter(
            team=t, is_active=True, user_id__in=active_workspace_user_ids
        )
        
        leaders = list(
            valid_memberships.filter(is_leader=True).values_list("user__username", flat=True)
        )

        # MANAGEMENT FIX: Never show Leader: None for Management team
        if t.team_type == TeamType.MANAGEMENT and not leaders:
            workspace = Workspace.objects.get(id=workspace_id)
            leaders = [workspace.owner.username]

        response_data.append(
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "is_private": t.is_private,
                "color": t.color,
                "icon": t.icon,
                "team_type": getattr(t, "team_type", "standard"),
                "member_count": valid_memberships.count(),
                "leaders": leaders,
                "created_at": t.created_at.isoformat(),
            }
        )
    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_members(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"error": "Not authorized"}, status=403)

    members = WorkspaceMembership.objects.filter(
        workspace_id=workspace_id, is_active=True
    ).select_related("user")

    response_data = []
    for m in members:
        # Map legacy roles to new Phase 1 RBAC matrix
        role = m.role
        if role == "employee":
            role = "member"
        elif role == "manager":
            role = "admin"

        # SSOT FIX: Include "Unassigned" team so frontend can group them correctly.
        user_teams_qs = TeamMembership.objects.filter(
            user=m.user,
            team__workspace_id=workspace_id,
            is_active=True,
        ).exclude(team__team_type=TeamType.GENERAL).select_related("team")

        teams_list = [{"id": tm.team.id, "name": tm.team.name, "is_leader": tm.is_leader} for tm in user_teams_qs]

        # Fetch profile image safely
        # FIX: Use .url directly to preserve S3 presigned query parameters
        avatar_url = None
        if hasattr(m.user, 'profile') and m.user.profile.profile_image:
            try:
                avatar_url = m.user.profile.profile_image.url
            except Exception:
                pass

        response_data.append(
            {
                "user_id": m.user.id,
                "username": m.user.username,
                "full_name": f"{m.user.first_name} {m.user.last_name}".strip()
                or m.user.username,
                "role": role,
                "profile_image": avatar_url, # FIX: Added profile image URL
                "teams": teams_list,  # NEW: Array of teams
                "team": teams_list[0]["name"] if teams_list else "Unassigned", # Keep for backward compat
                "joined_at": m.joined_at.isoformat(),
                "email": m.user.email,
                "phone_number": getattr(m.user.profile, 'phone_number', None) if hasattr(m.user, 'profile') else None,
                "bio": getattr(m.user.profile, 'bio', None) if hasattr(m.user, 'profile') else None,
                "designation": getattr(m.user.profile, 'designation', None) if hasattr(m.user, 'profile') else None,
            }
        )

    return Response(response_data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request, workspace_id):
    membership = WorkspaceMembership.objects.filter(
        user=request.user, workspace_id=workspace_id, is_active=True
    ).first()
    if not membership:
        return Response({"total_members": 0, "total_teams": 0, "total_leaders": 0, "role": "member"})

    active_user_ids = list(WorkspaceMembership.objects.filter(
        workspace_id=workspace_id, is_active=True
    ).values_list("user_id", flat=True))
    
    total_members = len(active_user_ids)

    total_leaders = TeamMembership.objects.filter(
        team__workspace_id=workspace_id,
        is_active=True,
        is_leader=True
    ).values("user_id").distinct().count()

 
    pending_approvals = Task.objects.filter(
        workspace_id=workspace_id, 
        status="pending_approval", 
        is_deleted=False
    ).count()
    
    overdue_tasks = Task.objects.filter(
        workspace_id=workspace_id, 
        status__in=["todo", "in_progress"], 
        due_date__lt=timezone.now(), 
        is_deleted=False
    ).count()
    
    open_invites = WorkspaceInvite.objects.filter(
        workspace_id=workspace_id, 
        status="pending"
    ).count()

    present_today = Attendance.objects.filter(
        user_id__in=active_user_ids, 
        workspace_id=workspace_id,
        date=timezone.localdate(), 
        check_out__isnull=True,
        status__in=["present", "late", "half_day"]
    ).count()
    
    absent_today = max(0, total_members - present_today)

    # Calculate Weekly Productivity Score
    seven_days_ago = timezone.now() - timedelta(days=7)
    completed_tasks_week = Task.objects.filter(
        workspace_id=workspace_id,
        status="completed",
        updated_at__gte=seven_days_ago,
        is_deleted=False
    ).count()
    
    total_assigned_tasks_week = Task.objects.filter(
        workspace_id=workspace_id,
        created_at__gte=seven_days_ago,
        is_deleted=False
    ).count()
    
    attendance_days_week = Attendance.objects.filter(
        user_id__in=active_user_ids,
        workspace_id=workspace_id,
        date__gte=seven_days_ago.date(),
        status__in=["present", "late", "half_day"]
    ).values('date').distinct().count()
    
    total_possible = total_assigned_tasks_week + 5 # 5 standard work days
    total_actual = completed_tasks_week + attendance_days_week
    productivity_score = min(100, int((total_actual / total_possible) * 100)) if total_possible > 0 else 0

    # Personalized data for members
    my_pending_tasks = 0
    my_overdue_tasks = 0
    my_dm_requests = 0
    
    if membership.role == "member":
        my_pending_tasks = Task.objects.filter(
            workspace_id=workspace_id, assigned_to=request.user, status__in=["todo", "in_progress"], is_deleted=False
        ).count()
        my_overdue_tasks = Task.objects.filter(
            workspace_id=workspace_id, assigned_to=request.user, status__in=["todo", "in_progress"], due_date__lt=timezone.now(), is_deleted=False
        ).count()
        try:
            from chat.models import DMRequest
            my_dm_requests = DMRequest.objects.filter(receiver=request.user, workspace_id=workspace_id, status="pending").count()
        except Exception:
            pass

    return Response(
        {
            "total_members": total_members,
            "total_teams": Team.objects.filter(workspace_id=workspace_id).count(),
            "total_leaders": total_leaders,
            "role": membership.role,
            "pending_approvals": pending_approvals,
            "overdue_tasks": overdue_tasks,
            "open_invites": open_invites,
            "present_today": present_today,
            "absent_today": absent_today,
            "productivity_score": productivity_score,
            "my_pending_tasks": my_pending_tasks,
            "my_overdue_tasks": my_overdue_tasks,
            "my_dm_requests": my_dm_requests,
        }
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace_presence(request, workspace_id):
    if not WorkspaceMembership.objects.filter(
        user_id=request.user.id, workspace_id=workspace_id, is_active=True
    ).exists():
        return Response({"error": "Unauthorized"}, status=403)

    try:
        from attendance.models import Attendance

        memberships = WorkspaceMembership.objects.filter(
            workspace_id=workspace_id, is_active=True
        ).select_related("user")
        active_user_ids = [m.user_id for m in memberships]

        active_attendances = Attendance.objects.filter(
            user_id__in=active_user_ids,
            workspace_id=workspace_id,
            date=timezone.localdate(),
            check_out__isnull=True,
            status__in=["present", "late", "half_day"]
        ).select_related('user')

        online_users = []
        for att in active_attendances:
            m = next((mem for mem in memberships if mem.user_id == att.user_id), None)
            if m:
                # Fetch user's active standard team
                team_membership = TeamMembership.objects.filter(
                    user=m.user, team__workspace_id=workspace_id, is_active=True
                ).exclude(team__team_type__in=[TeamType.UNASSIGNED, TeamType.GENERAL]).first()
                team_name = team_membership.team.name if team_membership else "Unassigned"
                
                online_users.append(
                    {
                        "id": m.user_id,
                        "username": m.user.username,
                        "full_name": m.user.get_full_name() or m.user.username,
                        "role": m.role,
                        "team": team_name,
                        "clock_in_time": att.check_in.isoformat()
                    }
                )

        return Response(
            {"online_users": online_users, "online_count": len(online_users)}
        )
    except Exception as e:
        return Response(
            {"online_users": [], "online_count": 0, "error": str(e)}, status=200
        )


class CreateTeamView(WorkspaceBaseView):
    required_permission = "create_teams"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Team name required"}, status=400)
        if Team.objects.filter(name=name, workspace=workspace).exists():
            return Response(
                {"error": "A team with this name already exists"}, status=400
            )

        leader_id = request.data.get("leader_id")
        leader = None
        if leader_id:
            leader_membership = WorkspaceMembership.objects.filter(
                user_id=leader_id, workspace=workspace, is_active=True
            ).first()
            if not leader_membership:
                return Response({"error": "Leader not found in workspace"}, status=404)
            leader = leader_membership.user

        # Create team directly to attach new fields
        team = Team.objects.create(
            workspace=workspace,
            name=name,
            description=request.data.get("description", ""),
            is_private=request.data.get("is_private", False),
            color=request.data.get("color", "#4B1587"),
            icon=request.data.get("icon", ""),
            team_type=TeamType.STANDARD
        )
        
        # Sync Chat Channel using centralized service
        from chat.services.chat_service import ChatService
        ChatService.create_channel(
            workspace=workspace,
            creator=request.user,
            name=team.name,
            channel_type="team",
            team=team
        )

        if leader:
            TeamService.add_member(team, leader)
            TeamService.promote_leader(team, leader)

        # PHASE 8: Directly add selected members during creation
        member_ids = request.data.get("member_ids", [])
        if member_ids:
            for mid in member_ids:
                try:
                    user_to_add = User.objects.get(id=mid)
                    if user_to_add != leader:
                        TeamService.add_member(team, user_to_add)
                except User.DoesNotExist:
                    pass

        return Response(
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "is_private": team.is_private,
                "color": team.color,
                "icon": team.icon,
                "leader": leader.username if leader else None,
            },
            status=201,
        )


class TeamDetailView(WorkspaceBaseView):
    """Handles updating (Rename/Description) and deleting a Team."""

    def patch(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(
                id=team_id, workspace=workspace, team_type=TeamType.STANDARD
            )
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found or cannot be modified."}, status=404
            )

        name = request.data.get("name")
        description = request.data.get("description")
        is_private = request.data.get("is_private")
        color = request.data.get("color")
        icon = request.data.get("icon")

        if name:
            team.name = name
        if description is not None:
            team.description = description
        if is_private is not None:
            team.is_private = is_private
        if color:
            team.color = color
        if icon is not None:
            team.icon = icon

        team.save()
        return Response(
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "is_private": team.is_private,
                "color": team.color,
                "icon": team.icon,
                "detail": "Team updated successfully",
            }
        )

    def delete(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(
                id=team_id, workspace=workspace, team_type=TeamType.STANDARD
            )
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found or cannot be deleted."}, status=404
            )

        # TeamService.delete_team handles deleting the associated chat channel
        TeamService.delete_team(team)
        return Response({"detail": "Team deleted successfully"})


class InviteMemberView(WorkspaceBaseView):
    required_permission = "invite_members"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()

        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        role = request.data.get("role", "member")
        # team_id is ignored here to enforce separation of concerns. 
        # Team assignment must happen via Team Invitations.

        if role not in ("member", "admin", "guest"):
            return Response(
                {"error": "role must be member, admin, or guest"}, status=400
            )

        target_user = None
        if username:
            try:
                target_user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": f"User '{username}' not found"}, status=404)
        elif email:
            try:
                target_user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": f"No user with email '{email}'"}, status=404)
        else:
            return Response({"error": "username or email required"}, status=400)

        # FIX: Only block if they are already an active member of THIS SPECIFIC workspace.
        # Allow inviting users who are in OTHER workspaces.
        if WorkspaceMembership.objects.filter(
            user=target_user, workspace=workspace, is_active=True
        ).exists():
            return Response({"error": "User is already in this workspace"}, status=400)

        # Check for existing pending invite to THIS workspace
        if WorkspaceInvite.objects.filter(
            invitee=target_user, workspace=workspace, status="pending"
        ).exists():
            return Response({"error": "User already has a pending invitation to this workspace"}, status=400)

        expires_at = timezone.now() + timedelta(days=4)
        invite = WorkspaceInvite.objects.create(
            workspace=workspace,
            created_by=request.user,
            invitee=target_user,
            role_to_assign=role,
            status="pending",
            expires_at=expires_at
        )

        try:
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=workspace.id,
                    event_description=f"You have been invited to join {workspace.name}",
                    member_ids=[target_user.id],
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit WorkspaceEvent: {e}")

        return Response(
            {
                "detail": "Invitation sent successfully",
                "invite_id": invite.id,
                "invitee_id": target_user.id,
                "status": invite.status,
            },
            status=201,
        )


class MemberDetailView(WorkspaceBaseView):
    """
    Unified view for handling PATCH (Move Team) and DELETE (Remove Member) on a specific user.
    """

    def patch(self, request, workspace_id, user_id):
        # Permission check: Must be admin/owner to manage roles
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace_id=workspace_id, is_active=True
        ).first()
        if not membership or membership.role not in ("owner", "admin"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = self.get_workspace()
        if user_id == request.user.id and "role" in request.data:
            return Response(
                {"error": "Use settings to update your own profile"}, status=400
            )

        target = (
            WorkspaceMembership.objects.filter(
                user_id=user_id, workspace=workspace, is_active=True
            )
            .select_related("user")
            .first()
        )
        if not target:
            return Response({"error": "Member not found in workspace"}, status=404)

        role = request.data.get("role")
        team_id = request.data.get("team_id", "NOT_SET")

        if role and role not in ("member", "admin", "guest"):
            return Response(
                {"error": "role must be member, admin, or guest"}, status=400
            )
        if role:
            target.role = role
            target.save()

        if team_id != "NOT_SET":
            # Permission check: Admins/Owners can move anyone anywhere.
            # Leaders can ONLY add users to teams they lead.
            if membership.role not in ("owner", "admin"):
                if team_id is not None:
                    try:
                        target_team = Team.objects.get(id=team_id, workspace=workspace)
                        if not is_team_leader(request.user, target_team.id):
                            return Response(
                                {"error": "Leaders can only add members to teams they lead"}, status=403
                            )
                    except Team.DoesNotExist:
                        return Response({"error": "Team not found"}, status=404)
                else:
                    # If team_id is None, it means moving to "Unassigned". 
                    # For MVP safety, only Admins/Owners can move to Unassigned.
                    return Response(
                        {"error": "Only admins can move members to unassigned"}, status=403
                    )

            # Remove from all current standard teams
            current_teams = TeamMembership.objects.filter(
                user=target.user,
                team__workspace=workspace,
                is_active=True,
                team__team_type=TeamType.STANDARD,
            )
            for tm in current_teams:
                TeamService.remove_member(tm.team, target.user)

            # Add to new team if provided
            if team_id is not None:
                try:
                    team = Team.objects.get(id=team_id, workspace=workspace)
                    TeamService.add_member(team, target.user)
                except Team.DoesNotExist:
                    return Response({"error": "Team not found"}, status=404)

        # Get updated team name for response
        new_team_name = (
            TeamMembership.objects.filter(
                user=target.user,
                team__workspace=workspace,
                is_active=True,
                team__team_type=TeamType.STANDARD,
            )
            .values_list("team__name", flat=True)
            .first()
        )

        return Response(
            {
                "detail": "Member updated",
                "user_id": user_id,
                "role": target.role,
                "team": new_team_name or "Unassigned",
            }
        )

    def delete(self, request, workspace_id, user_id):
        # Permission check: Must be admin/owner to remove members
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace_id=workspace_id, is_active=True
        ).first()
        if not membership or membership.role not in ("owner", "admin"):
            return Response({"error": "Not authorized"}, status=403)

        workspace = self.get_workspace()
        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" or target.user == request.user:
            return Response(
                {"error": "Cannot remove the workspace owner or yourself."}, status=403
            )

        WorkspaceService.leave_workspace(workspace, target.user)
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=target.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        return Response(
            {"message": f"{target.user.username} has been removed from the workspace."}
        )


class GenerateInviteLinkView(WorkspaceBaseView):
    required_permission = "invite_members"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        role = request.data.get("role", "member")
        expires_hours = int(request.data.get("expires_hours", 96))
        max_uses = int(request.data.get("max_uses", 0))

        if expires_hours < 24 or expires_hours > 720:
            return Response({"error": "Invalid expiry duration."}, status=400)

        membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )
        if role in ("owner", "admin") and membership.role not in ("owner", "admin"):
            return Response(
                {"error": "You cannot invite someone to a role higher than yours."},
                status=403,
            )

        expires_at = (
            timezone.now() + timedelta(hours=expires_hours) if expires_hours else None
        )
        invite = WorkspaceInvite.objects.create(
            workspace=workspace,
            created_by=request.user,
            role_to_assign=role,
            max_uses=max_uses,
            expires_at=expires_at,
        )

        # FIX: Use frontend URL environment variable so links/QRs point to the Next.js app
        import os
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        
        return Response(
            {
                "token": str(invite.token),
                "invite_url": f"{frontend_url}/join/{invite.token}",
                "role": role,
                "expires_at": invite.expires_at,
                "max_uses": max_uses,
            }
        )


from django.db import transaction

class JoinWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        # Use transaction.atomic and select_for_update to prevent race conditions on max_uses
        with transaction.atomic():
            try:
                invite = WorkspaceInvite.objects.select_for_update().get(token=token)
            except WorkspaceInvite.DoesNotExist:
                return Response({"error": "Invalid invite link."}, status=404)

            # Re-validate token status strictly inside the transaction
            if not invite.is_valid():
                return Response(
                    {"error": "This invite link has expired or been disabled."}, status=400
                )

            # Check if user is already a member (prevent invite replay)
            if WorkspaceMembership.objects.filter(
                user=request.user, workspace=invite.workspace, is_active=True
            ).exists():
                return Response({"error": "You are already a member of this workspace."}, status=400)

            try:
                WorkspaceService.join_workspace(
                    invite.workspace,
                    request.user,
                    role=invite.role_to_assign,
                    invited_by=invite.created_by,
                )
                invite.use_count += 1
                invite.save()
            except Exception as e:
                logger.error(f"Failed to join workspace via invite: {e}")
                return Response({"error": "Failed to join workspace."}, status=500)

        return Response(
            {
                "message": f"Successfully joined {invite.workspace.name}!",
                "workspace_id": invite.workspace.id,
                "workspace": invite.workspace.name,
                "role": invite.role_to_assign,
            }
        )


class InviteInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            invite = WorkspaceInvite.objects.select_related("workspace", "created_by").get(token=token)
        except WorkspaceInvite.DoesNotExist:
            return Response({"error": "Invalid invite link."}, status=404)

        if not invite.is_valid():
            return Response({"error": "This invite link has expired."}, status=400)
            
        workspace = invite.workspace
        member_count = WorkspaceMembership.objects.filter(workspace=workspace, is_active=True).count()
        
        return Response(
            {
                "workspace_name": workspace.name,
                "workspace_logo": workspace.logo.url if workspace.logo else None,
                "workspace_color": "#4B1587", # Fallback brand color
                "member_count": member_count,
                "created_at": workspace.created_at.isoformat(),
                "role": invite.role_to_assign,
                "inviter_id": invite.created_by.id,
                "inviter_name": invite.created_by.get_full_name() or invite.created_by.username,
                "inviter_username": invite.created_by.username,
                "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
            }
        )


class UpdateMemberRoleView(WorkspaceBaseView):
    required_permission = "manage_roles"

    def patch(self, request, workspace_id, user_id):
        new_role = request.data.get("role")
        if new_role not in ("owner", "admin", "member", "guest"):
            return Response(
                {
                    "error": f"Invalid role. Choose from: {('owner', 'admin', 'member', 'guest')}"
                },
                status=400,
            )

        workspace = self.get_workspace()
        my_membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )

        role_rank = {"owner": 5, "admin": 4, "member": 2, "guest": 1}
        if (
            role_rank.get(new_role, 0) >= role_rank.get(my_membership.role, 0)
            and my_membership.role != "owner"
        ):
            return Response(
                {"error": "You cannot assign a role equal to or higher than yours."},
                status=403,
            )

        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" and my_membership.role != "owner":
            return Response(
                {"error": "Cannot change the workspace owner's role."}, status=403
            )

        target.role = new_role
        target.save()
        
        # FIX: Sync Management Team membership when role changes
        WorkspaceService.sync_management_team_membership(workspace, target.user)

        return Response(
            {
                "message": f"Role updated to {new_role}.",
                "user": target.user.username,
                "role": new_role,
            }
        )


class RemoveMemberView(WorkspaceBaseView):
    required_permission = "remove_members"

    def delete(self, request, workspace_id, user_id):
        workspace = self.get_workspace()
        try:
            target = WorkspaceMembership.objects.get(
                workspace=workspace, user_id=user_id
            )
        except WorkspaceMembership.DoesNotExist:
            return Response({"error": "Member not found."}, status=404)

        if target.role == "owner" or target.user == request.user:
            return Response(
                {"error": "Cannot remove the workspace owner or yourself."}, status=403
            )

        WorkspaceService.leave_workspace(workspace, target.user)
        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=target.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        return Response(
            {"message": f"{target.user.username} has been removed from the workspace."}
        )


class MyPermissionsView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"role": None, "permissions": []})
        return Response(
            {
                "role": membership.role,
                "workspace": workspace.name,
                "workspace_id": workspace.id,
                "permissions": list(ROLE_PERMISSIONS.get(membership.role, set())),
            }
        )


class InviteCenterCountsView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        from chat.models import DMRequest

        now = timezone.now()
        DMRequest.objects.filter(
            receiver=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=now,
        ).update(status="expired")

        # Workspace invites are handled by MyWorkspaceInvitesView for independent users.
        # This endpoint now strictly returns counts for workspace-scoped invitations (Teams/Groups).
        return Response(
            {
                "workspace": 0, # Kept for frontend compatibility, always 0 here.
                "teams": TeamInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                ).count(),
                "private_groups": PrivateGroupInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                ).count(),
            }
        )


class InviteCenterTabView(WorkspaceBaseView):
    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        tab = request.query_params.get("tab", "")

        # Workspace invites are no longer handled here to prevent architectural confusion.
        if tab == "teams":
            TeamInvite.objects.filter(
                invitee=request.user,
                workspace=workspace,
                status="pending",
                expires_at__lte=timezone.now(),
            ).update(status="expired")
            invites = (
                TeamInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                )
                .select_related("team", "inviter")
                .order_by("-created_at")
            )
            return Response(
                {
                    "items": [
                        {
                            "id": inv.id,
                            "team_id": inv.team.id,
                            "team_name": inv.team.name,
                            "inviter_id": inv.inviter.id,
                            "inviter_name": inv.inviter.get_full_name()
                            or inv.inviter.username,
                            "expires_at": (
                                inv.expires_at.isoformat() if inv.expires_at else None
                            ),
                            "created_at": inv.created_at.isoformat(),
                        }
                        for inv in invites
                    ]
                }
            )

        elif tab == "private_groups":
            PrivateGroupInvite.objects.filter(
                invitee=request.user,
                workspace=workspace,
                status="pending",
                expires_at__lte=timezone.now(),
            ).update(status="expired")
            invites = (
                PrivateGroupInvite.objects.filter(
                    invitee=request.user, workspace=workspace, status="pending"
                )
                .select_related("channel", "inviter")
                .order_by("-created_at")
            )
            return Response(
                {
                    "items": [
                        {
                            "id": inv.id,
                            "channel_id": inv.channel.id,
                            "channel_name": inv.channel.name,
                            "inviter_id": inv.inviter.id,
                            "inviter_name": inv.inviter.get_full_name()
                            or inv.inviter.username,
                            "expires_at": (
                                inv.expires_at.isoformat() if inv.expires_at else None
                            ),
                            "created_at": inv.created_at.isoformat(),
                        }
                        for inv in invites
                    ]
                }
            )

        else:
            return Response({"error": "Invalid tab"}, status=400)


class TeamInviteView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        team_id = request.data.get("team_id")
        invitee_id = request.data.get("user_id")
        if not team_id or not invitee_id:
            return Response({"error": "team_id and user_id required"}, status=400)

        team = Team.objects.filter(id=team_id, workspace=workspace).first()
        if not team:
            return Response({"error": "Team not found"}, status=404)

        membership = WorkspaceMembership.objects.get(
            user=request.user, workspace=workspace, is_active=True
        )
        if membership.role not in ("owner", "admin") and not is_team_leader(
            request.user, team.id
        ):
            return Response(
                {"error": "You do not have permission to invite to this team"},
                status=403,
            )

        invitee_membership = WorkspaceMembership.objects.filter(
            user_id=invitee_id, workspace=workspace, is_active=True
        ).first()
        if not invitee_membership:
            return Response({"error": "User not found in workspace"}, status=404)
        invitee = invitee_membership.user

        if TeamMembership.objects.filter(
            team=team, user=invitee, is_active=True
        ).exists():
            return Response({"error": "User is already in this team"}, status=400)
        if TeamInvite.objects.filter(
            team=team, invitee=invitee, workspace=workspace, status="pending"
        ).exists():
            return Response({"error": "Invite already pending"}, status=409)

        expires_at = timezone.now() + timedelta(days=4)
        invite = TeamInvite.objects.create(
            team=team,
            inviter=request.user,
            invitee=invitee,
            workspace=workspace,
            status="pending",
            expires_at=expires_at,
        )

        try:
            NotificationService.create_and_emit(
                WorkspaceEvent(
                    actor_id=request.user.id,
                    workspace_id=workspace.id,
                    event_description=f"You've been invited to join team {team.name}",
                    member_ids=[invitee.id],
                )
            )
        except Exception:
            pass
        return Response(
            {
                "id": invite.id,
                "team_id": team.id,
                "team_name": team.name,
                "invitee_id": invitee.id,
                "status": invite.status,
                "expires_at": invite.expires_at.isoformat(),
            },
            status=201,
        )


class TeamInviteRespondView(WorkspaceBaseView):
    def patch(self, request, workspace_id, pk):
        workspace = self.get_workspace()
        TeamInvite.objects.filter(
            invitee=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = TeamInvite.objects.get(
                id=pk, invitee=request.user, workspace=workspace
            )
        except TeamInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=404)

        if invite.status != "pending":
            return Response({"error": f"Invite is already {invite.status}"}, status=400)
        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"}, status=400
            )

        if new_status == "accepted":
            TeamService.add_member(invite.team, request.user)

        invite.status = new_status
        invite.save()
        return Response(
            {
                "id": invite.id,
                "team_id": invite.team.id,
                "team_name": invite.team.name,
                "status": invite.status,
            }
        )


class LeaveTeamView(WorkspaceBaseView):
    def post(self, request, workspace_id, team_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=404)

        if is_team_leader(request.user, team.id):
            return Response(
                {"error": "Transfer leadership before leaving the team"}, status=400
            )

        TeamService.remove_member(team, request.user)
        return Response(
            {
                "detail": f"Left team {team.name}. You retain read-only access to history."
            }
        )


class PrivateGroupInviteView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        channel_id = request.data.get("channel_id")
        invitee_ids = request.data.get("user_ids", [])
        if not channel_id or not invitee_ids:
            return Response({"error": "channel_id and user_ids required"}, status=400)

        try:
            from chat.models import Channel, ChannelMember

            channel = Channel.objects.get(
                id=channel_id, workspace=workspace, channel_type="private_group"
            )
        except Exception:
            return Response({"error": "Private group not found"}, status=404)

        is_owner = channel.owner == request.user
        is_admin = ChannelMember.objects.filter(
            channel=channel, user=request.user, role="admin", is_active=True
        ).exists()
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only the group creator or admin can invite"}, status=403
            )

        created_invites = []
        expires_at = timezone.now() + timedelta(hours=24)
        for uid in invitee_ids:
            if not WorkspaceMembership.objects.filter(
                user_id=uid, workspace=workspace, is_active=True
            ).exists():
                continue
            if ChannelMember.objects.filter(
                channel=channel, user_id=uid, is_active=True
            ).exists():
                continue
            if PrivateGroupInvite.objects.filter(
                channel=channel, invitee_id=uid, workspace=workspace, status="pending"
            ).exists():
                continue

            invite = PrivateGroupInvite.objects.create(
                channel=channel,
                inviter=request.user,
                invitee_id=uid,
                workspace=workspace,
                status="pending",
                expires_at=expires_at,
            )
            created_invites.append(invite.id)
            try:
                NotificationService.create_and_emit(
                    WorkspaceEvent(
                        actor_id=request.user.id,
                        workspace_id=workspace.id,
                        event_description=f"You've been invited to group {channel.name}",
                        member_ids=[uid],
                    )
                )
            except Exception:
                pass

        return Response(
            {"created_count": len(created_invites), "invite_ids": created_invites},
            status=201,
        )


class PrivateGroupInviteRespondView(WorkspaceBaseView):
    def patch(self, request, workspace_id, pk):
        workspace = self.get_workspace()
        PrivateGroupInvite.objects.filter(
            invitee=request.user,
            workspace=workspace,
            status="pending",
            expires_at__lte=timezone.now(),
        ).update(status="expired")

        try:
            invite = PrivateGroupInvite.objects.get(
                id=pk, invitee=request.user, workspace=workspace
            )
        except PrivateGroupInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=404)

        if invite.status != "pending":
            return Response({"error": f"Invite is already {invite.status}"}, status=400)
        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response(
                {"error": "status must be 'accepted' or 'rejected'"}, status=400
            )

        if new_status == "accepted":
            try:
                from chat.models import Channel, ChannelMember

                channel = invite.channel
                ChannelMember.objects.update_or_create(
                    channel=channel,
                    user=request.user,
                    defaults={"role": "member", "is_active": True, "left_at": None},
                )
                if channel.is_pending:
                    if (
                        ChannelMember.objects.filter(
                            channel=channel, is_active=True
                        ).count()
                        >= 2
                    ):
                        channel.is_pending = False
                        channel.save()
            except Exception:
                pass

        invite.status = new_status
        invite.save()
        return Response(
            {
                "id": invite.id,
                "channel_id": invite.channel.id,
                "channel_name": invite.channel.name,
                "status": invite.status,
            }
        )


class CleanupPendingGroupsView(WorkspaceBaseView):
    required_permission = "manage_channels"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        from chat.models import Channel, ChannelMember

        cutoff = timezone.now() - timedelta(hours=24)
        pending_groups = Channel.objects.filter(
            workspace=workspace,
            channel_type="private_group",
            is_pending=True,
            created_at__lte=cutoff,
        )

        deleted = []
        for group in pending_groups:
            if ChannelMember.objects.filter(channel=group, is_active=True).count() < 2:
                try:
                    NotificationService.create_and_emit(
                        WorkspaceEvent(
                            actor_id=request.user.id,
                            workspace_id=workspace.id,
                            event_description=f"Group '{group.name}' was deleted: not enough members joined within 24 hours.",
                            member_ids=[group.owner_id] if group.owner_id else [],
                        )
                    )
                except Exception:
                    pass
                group.delete()
                deleted.append(group.name)

        return Response({"deleted_groups": deleted, "count": len(deleted)})


class LeaveWorkspaceView(WorkspaceBaseView):
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"error": "No workspace found"}, status=404)

        if membership.role == "owner":
            return Response(
                {
                    "error": "Workspace owners cannot leave. Transfer ownership or delete the workspace."
                },
                status=403,
            )

        WorkspaceService.leave_workspace(workspace, request.user)

        try:
            from notifications.models import Notification

            Notification.objects.filter(
                recipient=request.user, workspace=workspace, status="unread"
            ).update(status="archived")
        except Exception:
            pass

        try:
            from chat.models import DMRequest

            DMRequest.objects.filter(workspace=workspace, status="pending").filter(
                models.Q(sender=request.user) | models.Q(receiver=request.user)
            ).update(status="expired")
        except Exception:
            pass

        return Response({"message": f"You have left {workspace.name}."})

class CreateWorkspaceView(APIView):
    """General endpoint to create a workspace. Validates permissions."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if WorkspaceMembership.objects.filter(user=request.user, is_active=True).exists():
            return Response(
                {"error": "You are already an active member of a workspace. Please leave it first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Workspace name is required."}, status=400)

        workspace = WorkspaceService.create_workspace(name=name, owner=request.user)
        return Response(
            {"workspace_id": workspace.id, "message": "Workspace created successfully!"},
            status=status.HTTP_201_CREATED
        )
        
class MyWorkspaceInvitesView(APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        WorkspaceInvite.objects.filter(
            invitee=request.user, status="pending", expires_at__lte=timezone.now()
        ).update(status="expired")

        invites = WorkspaceInvite.objects.filter(
            invitee=request.user, status="pending"
        ).select_related("workspace", "created_by")

        return Response({
            "items": [
                {
                    "id": inv.id,
                    "workspace_id": inv.workspace.id,
                    "workspace_name": inv.workspace.name,
                    "inviter_id": inv.created_by.id,
                    "inviter_name": inv.created_by.get_full_name() or inv.created_by.username,
                    "role": inv.role_to_assign,
                    "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
                    "created_at": inv.created_at.isoformat(),
                }
                for inv in invites
            ]
        })


class WorkspaceInviteRespondView(APIView):
    """Endpoint for Independent users to Accept or Reject a workspace invitation."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        invite = get_object_or_404(WorkspaceInvite, id=pk, invitee=request.user)
        
        if invite.status != "pending":
            return Response({"error": f"Invite is already {invite.status}"}, status=400)
            
        if invite.expires_at and timezone.now() > invite.expires_at:
            invite.status = "expired"
            invite.save()
            return Response({"error": "Invite has expired"}, status=400)

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return Response({"error": "status must be 'accepted' or 'rejected'"}, status=400)

        if new_status == "accepted":
            # Use existing service to join workspace properly
            WorkspaceService.join_workspace(
                invite.workspace, request.user, role=invite.role_to_assign, invited_by=invite.created_by
            )
            invite.status = "accepted"
        else:
            invite.status = "rejected"
            
        invite.save()
        
        return Response({
            "id": invite.id,
            "workspace_id": invite.workspace.id,
            "status": invite.status
        })

class TransferOwnershipView(WorkspaceBaseView):
    """Allows the current owner to transfer ownership to another active member."""
    required_permission = "delete_workspace"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        new_owner_id = request.data.get("new_owner_id")
        
        if not new_owner_id:
            return Response({"error": "new_owner_id required"}, status=400)
            
        new_owner_membership = WorkspaceMembership.objects.filter(
            user_id=new_owner_id, workspace=workspace, is_active=True
        ).first()
        
        if not new_owner_membership:
            return Response({"error": "New owner not found in workspace"}, status=404)
            
        if new_owner_membership.user == request.user:
            return Response({"error": "You cannot transfer ownership to yourself"}, status=400)
            
        with transaction.atomic():
            # Demote current owner to admin
            current_membership = WorkspaceMembership.objects.get(
                user=request.user, workspace=workspace, is_active=True
            )
            current_membership.role = "admin"
            current_membership.save()
            
            # Promote new owner
            new_owner_membership.role = "owner"
            new_owner_membership.save()
            
            # Update workspace owner field
            workspace.owner = new_owner_membership.user
            workspace.save()
            
        return Response({"detail": "Ownership transferred successfully"})
    
class PromoteTeamLeaderView(WorkspaceBaseView):

    def post(self, request, workspace_id, team_id, user_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=404)

        # Only Owners/Admins or the current Team Leader can promote
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"error": "Not authorized"}, status=403)

        is_admin = membership.role in ("owner", "admin")
        is_current_leader = is_team_leader(request.user, team.id)
        
        if not (is_admin or is_current_leader):
            return Response({"error": "Only admins or team leaders can promote others"}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        try:
            TeamService.promote_leader(team, target_user)
        except Exception as e:
            logger.error(f"Failed to promote leader: {e}")
            return Response({"error": "A server error occurred while promoting the leader."}, status=500)

        return Response({"detail": f"{target_user.username} promoted to leader of {team.name}"})
    
class DemoteTeamLeaderView(WorkspaceBaseView):

    def post(self, request, workspace_id, team_id, user_id):
        workspace = self.get_workspace()
        try:
            team = Team.objects.get(id=team_id, workspace=workspace)
        except Team.DoesNotExist:
            return Response({"error": "Team not found"}, status=404)

        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        if not membership:
            return Response({"error": "Not authorized"}, status=403)

        is_admin = membership.role in ("owner", "admin")
        is_current_leader = is_team_leader(request.user, team.id)
        
        if not (is_admin or is_current_leader):
            return Response({"error": "Only admins or team leaders can demote others"}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        try:
            TeamService.demote_leader(team, target_user)
        except Exception as e:
            logger.error(f"Failed to demote leader: {e}")
            return Response({"error": "A server error occurred while demoting the leader."}, status=500)

        return Response({"detail": f"{target_user.username} demoted from leader of {team.name}"})


class WorkspaceSettingsView(WorkspaceBaseView):
    """Allows Owner/Admin to update workspace name, description, and logo."""
    required_permission = "manage_workspace"

    def get(self, request, workspace_id):
        workspace = self.get_workspace()
        return Response({
            "id": workspace.id,
            "name": workspace.name,
            "description": workspace.description,
            "logo": workspace.logo.url if workspace.logo else None,
            "pending_delete": workspace.pending_delete,
            "deletion_at": workspace.deletion_at.isoformat() if workspace.deletion_at else None,
        })

    def patch(self, request, workspace_id):
        workspace = self.get_workspace()
        
        membership = WorkspaceMembership.objects.filter(
            user=request.user, workspace=workspace, is_active=True
        ).first()
        # FIX: Only the owner can edit workspace settings, not admins.
        if not membership or membership.role != "owner":
            return Response({"error": "Only the workspace owner can modify these settings."}, status=403)

        name = request.data.get("name")
        description = request.data.get("description")
        logo = request.FILES.get("logo")

        if name:
            workspace.name = name
        if description is not None:
            workspace.description = description
        if logo:
            try:
                validate_image_file(logo)
            except Exception as e:
                return Response({"error": str(e)}, status=400)
            
            # NOTE: We don't delete the old logo here. The Workspace model's save() method
            # automatically detects the change and deletes the old file from S3.
            workspace.logo = logo

        workspace.save()
        return Response({
            "id": workspace.id,
            "name": workspace.name,
            "description": workspace.description,
            "logo": workspace.logo.url if workspace.logo else None,
            "detail": "Workspace updated successfully"
        })

from datetime import timedelta
from django.utils import timezone

class ScheduleDeletionView(WorkspaceBaseView):
    """Allows Owner to schedule workspace deletion (24h cooldown)."""
    required_permission = "delete_workspace"

    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        if workspace.owner != request.user:
            return Response({"error": "Only the owner can schedule deletion."}, status=403)

        workspace.pending_delete = True
        workspace.deletion_requested_at = timezone.now()
        workspace.deletion_at = timezone.now() + timedelta(hours=24)
        workspace.save()
        
        return Response({"message": "Workspace deletion scheduled. It will be permanently deleted in 24 hours."})

class CancelDeletionView(WorkspaceBaseView):
    """Allows Owner to cancel scheduled deletion."""
    def post(self, request, workspace_id):
        workspace = self.get_workspace()
        if workspace.owner != request.user:
            return Response({"error": "Only the owner can cancel deletion."}, status=403)

        workspace.pending_delete = False
        workspace.deletion_requested_at = None
        workspace.deletion_at = None
        workspace.save()
        
        return Response({"message": "Workspace deletion canceled. Everything is back to normal."})