from django.core.management.base import BaseCommand
from workspaces.models import Workspace, Team, TeamType, WorkspaceMembership
from chat.models import Channel, ChannelMember, Message


class Command(BaseCommand):
    help = (
        "Reconciles General channels: deduplicates, links teams, and fixes memberships."
    )

    def handle(self, *args, **options):
        self.stdout.write("Starting General channel reconciliation...")

        for ws in Workspace.objects.all():
            self.stdout.write(f"Processing Workspace: {ws.name} (ID: {ws.id})")

            # 1. Get or create General Team
            general_team, team_created = Team.objects.get_or_create(
                workspace=ws, team_type=TeamType.GENERAL, defaults={"name": "General"}
            )
            if team_created:
                self.stdout.write(
                    self.style.SUCCESS(f"  + Created missing General Team")
                )

            # 2. Find all official channels named "General" in this workspace
            general_channels = Channel.objects.filter(
                workspace=ws, name__iexact="General", channel_type="official"
            )

            if not general_channels.exists():
                # Need to create it
                target_slug = f"general-{ws.id}"

                # Safety check: clear out any abandoned channels with this slug
                Channel.objects.filter(slug=target_slug).delete()

                general_chat = Channel.objects.create(
                    name="General",
                    slug=target_slug,
                    channel_type="official",
                    workspace=ws,
                    team=general_team,
                    created_by=ws.owner,
                )
                self.stdout.write(
                    self.style.SUCCESS(f"  + Created missing General Channel")
                )
            else:
                # Pick the oldest one as the canonical one
                general_chat = general_channels.order_by("created_at").first()

                # Resolve slug conflicts before saving
                target_slug = f"general-{ws.id}"
                conflicting_channel = (
                    Channel.objects.filter(slug=target_slug)
                    .exclude(id=general_chat.id)
                    .first()
                )
                if conflicting_channel:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  - Resolving slug conflict for '{target_slug}'"
                        )
                    )
                    # If the conflict is another duplicate General channel, delete it
                    if (
                        conflicting_channel.name.lower() == "general"
                        and conflicting_channel.channel_type == "official"
                    ):
                        Message.objects.filter(channel=conflicting_channel).update(
                            channel=general_chat
                        )
                        ChannelMember.objects.filter(
                            channel=conflicting_channel
                        ).delete()
                        conflicting_channel.delete()
                    else:
                        # Otherwise, just rename the slug of the conflicting non-General channel
                        conflicting_channel.slug = (
                            f"{target_slug}-old-{conflicting_channel.id}"
                        )
                        conflicting_channel.save()

                general_chat.team = general_team
                general_chat.slug = target_slug
                general_chat.save()

                # Delete remaining duplicates
                duplicates = general_channels.exclude(id=general_chat.id)
                if duplicates.exists():
                    self.stdout.write(
                        self.style.WARNING(
                            f"  - Found {duplicates.count()} duplicate General channels. Deleting..."
                        )
                    )
                    for dup in duplicates:
                        Message.objects.filter(channel=dup).update(channel=general_chat)
                        ChannelMember.objects.filter(channel=dup).delete()
                        dup.delete()

            # 3. Ensure all active workspace members are in the General channel
            active_members = WorkspaceMembership.objects.filter(
                workspace=ws, is_active=True
            )
            for membership in active_members:
                _, created = ChannelMember.objects.get_or_create(
                    channel=general_chat,
                    user=membership.user,
                    defaults={"role": "member", "is_active": True},
                )
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  + Added {membership.user.username} to General channel"
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Reconciliation complete."))
