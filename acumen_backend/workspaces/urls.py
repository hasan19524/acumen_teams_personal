# acumen_backend/workspaces/urls.py
from django.urls import path
from .views import CreateWorkspaceView
from . import views


urlpatterns = [
    # System / Global routes (No workspace_id needed, token-based)
    path(
        "join/<uuid:token>/", views.JoinWorkspaceView.as_view(), name="join_workspace"
    ),
    path("join/<uuid:token>/info/", views.InviteInfoView.as_view(), name="invite_info"),
    # Workspace-scoped routes (Strictly enforced)
    path("<int:workspace_id>/", views.my_workspace, name="my_workspace"),
    path("<int:workspace_id>/presence/", views.workspace_presence, name="workspace_presence"),
    path(
        "<int:workspace_id>/my-permissions/",
        views.MyPermissionsView.as_view(),
        name="my_permissions",
    ),
    path(
        "<int:workspace_id>/leave/",
        views.LeaveWorkspaceView.as_view(),
        name="leave_workspace",
    ),
    path(
        "<int:workspace_id>/transfer-ownership/",
        views.TransferOwnershipView.as_view(),
        name="transfer_ownership",
    ),
    path(
        "<int:workspace_id>/members/", views.workspace_members, name="workspace_members"
    ),
    path(
        "<int:workspace_id>/members/<int:user_id>/role/",
        views.UpdateMemberRoleView.as_view(),
        name="update_role",
    ),
    path(
        "<int:workspace_id>/members/<int:user_id>/",
        views.MemberDetailView.as_view(),
        name="member_detail",
    ),
    path(
        "<int:workspace_id>/invite/",
        views.InviteMemberView.as_view(),
        name="invite_member",
    ),
    path(
        "<int:workspace_id>/invite/generate/",
        views.GenerateInviteLinkView.as_view(),
        name="generate_invite",
    ),
    # Team routes
    path("<int:workspace_id>/teams/", views.all_teams, name="all_teams"),
    path(
        "<int:workspace_id>/teams/create/",
        views.CreateTeamView.as_view(),
        name="create_team",
    ),
    path(
        "<int:workspace_id>/teams/<int:team_id>/",
        views.TeamDetailView.as_view(),
        name="team_detail",
    ),
    path("<int:workspace_id>/my-team/", views.my_team, name="my_team"),
    path(
        "<int:workspace_id>/teams/invite/",
        views.TeamInviteView.as_view(),
        name="team_invite",
    ),
    path(
        "<int:workspace_id>/settings/",
        views.WorkspaceSettingsView.as_view(),
        name="workspace_settings",
    ),
    path(
        "<int:workspace_id>/teams/invite/<int:pk>/",
        views.TeamInviteRespondView.as_view(),
        name="team_invite_respond",
    ),
    path(
        "<int:workspace_id>/teams/<int:team_id>/leave/",
        views.LeaveTeamView.as_view(),
        name="leave_team",
    ),
    path(
        "<int:workspace_id>/teams/<int:team_id>/members/<int:user_id>/promote/",
        views.PromoteTeamLeaderView.as_view(),
        name="promote_leader"
    ),
    path(
        "<int:workspace_id>/teams/<int:team_id>/members/<int:user_id>/demote/",
        views.DemoteTeamLeaderView.as_view(),
        name="demote_leader"
    ),
    # Invite Center & Groups
    path(
        "<int:workspace_id>/invites/counts/",
        views.InviteCenterCountsView.as_view(),
        name="invite_counts",
    ),
    path(
        "<int:workspace_id>/invites/",
        views.InviteCenterTabView.as_view(),
        name="invite_center",
    ),
    path(
        "<int:workspace_id>/groups/invite/",
        views.PrivateGroupInviteView.as_view(),
        name="group_invite",
    ),
    path(
        "<int:workspace_id>/groups/invite/<int:pk>/",
        views.PrivateGroupInviteRespondView.as_view(),
        name="group_invite_respond",
    ),
    path(
        "<int:workspace_id>/groups/cleanup/",
        views.CleanupPendingGroupsView.as_view(),
        name="cleanup_groups",
    ),
    # Independent User Invitation Routes
    path(
        "invites/me/", 
        views.MyWorkspaceInvitesView.as_view(), 
        name="my_workspace_invites"
    ),
    path(
        "invites/<int:pk>/respond/", 
        views.WorkspaceInviteRespondView.as_view(), 
        name="workspace_invite_respond"
    ),
    path("<int:workspace_id>/stats/", views.dashboard_stats, name="dashboard_stats"),
    path("create/", CreateWorkspaceView.as_view(), name="create-workspace"),
    path("create/", CreateWorkspaceView.as_view(), name="create-workspace"),
    path("<int:workspace_id>/schedule-deletion/", views.ScheduleDeletionView.as_view(), name="schedule_deletion"),
    path("<int:workspace_id>/cancel-deletion/", views.CancelDeletionView.as_view(), name="cancel_deletion"),

]
