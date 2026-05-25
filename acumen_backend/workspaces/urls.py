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
]
