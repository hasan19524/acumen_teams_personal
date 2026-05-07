from django.contrib import admin
from .models import Workspace, Team, UserProfile

admin.site.register(Workspace)
admin.site.register(Team)
admin.site.register(UserProfile)
