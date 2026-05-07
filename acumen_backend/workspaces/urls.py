from django.urls import path
from . import views

urlpatterns = [
    path("my/", views.my_workspace),
    path("team/my/", views.my_team),
    path("teams/", views.all_teams),
    path("members/", views.workspace_members),
    path("stats/", views.dashboard_stats),
]