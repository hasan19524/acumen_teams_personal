from django.db import migrations
from django.utils import timezone


def populate_new_fields(apps, schema_editor):
    Workspace = apps.get_model("workspaces", "Workspace")
    Team = apps.get_model("workspaces", "Team")
    TeamMembership = apps.get_model("workspaces", "TeamMembership")
    WorkspaceMembership = apps.get_model("workspaces", "WorkspaceMembership")
    Channel = apps.get_model("chat", "Channel")

    # 1. Create "Unassigned Team" for each workspace and link it
    for ws in Workspace.objects.all():
        unassigned_team, created = Team.objects.get_or_create(
            workspace=ws, is_unassigned=True, defaults={"name": "Unassigned"}
        )
        ws.unassigned_team = unassigned_team
        ws.save()

        # Add users with no team to the unassigned team
        ws_member_ids = WorkspaceMembership.objects.filter(
            workspace=ws, is_active=True
        ).values_list("user_id", flat=True)

        for user_id in ws_member_ids:
            if not TeamMembership.objects.filter(
                user_id=user_id, is_active=True
            ).exists():
                TeamMembership.objects.get_or_create(
                    team=unassigned_team,
                    user_id=user_id,
                    defaults={"is_active": True, "is_leader": False},
                )

    # 2. Mark existing team leaders as is_leader=True
    for team in Team.objects.filter(leader__isnull=False):
        TeamMembership.objects.filter(team=team, user=team.leader).update(
            is_leader=True
        )

    # 3. Set channel_type for existing channels
    # DMs
    Channel.objects.filter(is_dm=True).update(channel_type="dm")
    # Official (non-DM, non-private channels)
    Channel.objects.filter(is_dm=False, is_private=False).update(
        channel_type="official"
    )
    # Private groups
    Channel.objects.filter(is_private=True).update(channel_type="private_group")


class Migration(migrations.Migration):

    dependencies = [
        ("workspaces", "0003_team_is_unassigned_teammembership_is_active_and_more"),
        ("chat", "0012_remove_notification_chat_notifi_recipie_eadc39_idx_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_new_fields, migrations.RunPython.noop),
    ]
