from django.contrib import admin
from .models import (
    Workspace,
    Team,
    WorkspaceMembership,
    WorkspaceInvite,
    TeamMembership,
)

admin.site.register(Workspace)
admin.site.register(Team)
admin.site.register(WorkspaceMembership)
admin.site.register(WorkspaceInvite)
admin.site.register(TeamMembership)
