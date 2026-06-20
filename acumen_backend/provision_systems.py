# provision_systems.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from workspaces.models import (
    Workspace,
    Team,
    TeamType,
    TeamMembership,
    WorkspaceMembership,
)
from chat.models import Channel, ChannelMember
from django.db import transaction

for ws in Workspace.objects.all():
    print(f"Provisioning Workspace: {ws.name}")
    with transaction.atomic():
        # 1. Create System Teams
        general, _ = Team.objects.get_or_create(
            workspace=ws, team_type=TeamType.GENERAL, defaults={"name": "General"}
        )
        management, _ = Team.objects.get_or_create(
            workspace=ws, team_type=TeamType.MANAGEMENT, defaults={"name": "Management"}
        )
        unassigned, _ = Team.objects.get_or_create(
            workspace=ws, team_type=TeamType.UNASSIGNED, defaults={"name": "Unassigned"}
        )
        ws.unassigned_team = unassigned
        ws.save()

        owner = ws.owner

        # 2. Team Memberships for Owner
        TeamMembership.objects.get_or_create(
            team=general, user=owner, defaults={"is_active": True}
        )
        TeamMembership.objects.get_or_create(
            team=management, user=owner, defaults={"is_active": True}
        )

        # 3. Channels
        gen_chat, _ = Channel.objects.get_or_create(
            slug=f"general-{ws.id}",
            defaults={
                "name": "General",
                "channel_type": "official",
                "workspace": ws,
                "created_by": owner,
            },
        )
        mgmt_chat, _ = Channel.objects.get_or_create(
            slug=f"management-{ws.id}",
            defaults={
                "name": "Management",
                "channel_type": "official",
                "workspace": ws,
                "created_by": owner,
            },
        )

        # 4. Channel Memberships for Owner
        ChannelMember.objects.get_or_create(
            channel=gen_chat, user=owner, defaults={"role": "admin", "is_active": True}
        )
        ChannelMember.objects.get_or_create(
            channel=mgmt_chat, user=owner, defaults={"role": "admin", "is_active": True}
        )

        # Add all active workspace members to General chat if missing
        for member in WorkspaceMembership.objects.filter(workspace=ws, is_active=True):
            ChannelMember.objects.get_or_create(
                channel=gen_chat,
                user=member.user,
                defaults={"role": "member", "is_active": True},
            )

print("System teams and chats provisioned successfully!")
