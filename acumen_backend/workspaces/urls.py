# workspaces/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path("", views.my_workspace, name="my_workspace"),
    path("members/", views.workspace_members, name="workspace_members"),
    path(
        "members/<int:user_id>/role/",
        views.UpdateMemberRoleView.as_view(),
        name="update_role",
    ),
    path(
        "members/<int:user_id>/", views.RemoveMemberView.as_view(), name="remove_member"
    ),
    path("invite/", views.InviteMemberView.as_view(), name="invite_member"),
    path("teams/create/", views.CreateTeamView.as_view(), name="create_team"),
    path("teams/", views.all_teams, name="all_teams"),
    path("my-team/", views.my_team, name="my_team"),
    path("stats/", views.dashboard_stats, name="dashboard_stats"),
    path(
        "invite/generate/",
        views.GenerateInviteLinkView.as_view(),
        name="generate_invite",
    ),
    path(
        "join/<uuid:token>/", views.JoinWorkspaceView.as_view(), name="join_workspace"
    ),
    path("join/<uuid:token>/info/", views.InviteInfoView.as_view(), name="invite_info"),
    path("my-permissions/", views.MyPermissionsView.as_view(), name="my_permissions"),
    path(
        "invites/counts/", views.InviteCenterCountsView.as_view(), name="invite_counts"
    ),
    path("invites/", views.InviteCenterTabView.as_view(), name="invite_center"),
    path("teams/invite/", views.TeamInviteView.as_view(), name="team_invite"),
    path(
        "teams/invite/<int:pk>/",
        views.TeamInviteRespondView.as_view(),
        name="team_invite_respond",
    ),
    path(
        "teams/<int:team_id>/leave/", views.LeaveTeamView.as_view(), name="leave_team"
    ),
    path("groups/invite/", views.PrivateGroupInviteView.as_view(), name="group_invite"),
    path(
        "groups/invite/<int:pk>/",
        views.PrivateGroupInviteRespondView.as_view(),
        name="group_invite_respond",
    ),
    path(
        "groups/cleanup/",
        views.CleanupPendingGroupsView.as_view(),
        name="cleanup_groups",
    ),
    path("leave/", views.LeaveWorkspaceView.as_view(), name="leave_workspace"),
]
