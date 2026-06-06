# workspaces/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

from workspaces.models import Team

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Team)
def create_team_chat_channel(sender, instance, created, **kwargs):
    """
    Auto-create a team chat channel when a new Team is created.
    Adds all existing active team members to the channel.
    """
    if created:
        from chat.models import Channel, ChannelMember
        from workspaces.models import TeamMembership

        # Prevent duplicate if signal fires twice
        if not Channel.objects.filter(team=instance, channel_type="team").exists():
            creator = instance.leader or instance.workspace.owner

            channel = Channel.objects.create(
                name=f"{instance.name}",
                slug=f"team-{instance.id}-{slugify(instance.name)}",
                channel_type="team",
                workspace=instance.workspace,
                team=instance,
                created_by=creator,
            )

            # Auto-add all existing active team members
            team_member_ids = TeamMembership.objects.filter(
                team=instance, is_active=True
            ).values_list("user_id", flat=True)

            members = [
                ChannelMember(channel=channel, user_id=uid, role="member")
                for uid in team_member_ids
            ]

            # Ensure team leader is admin of the channel
            if instance.leader_id:
                members = [m for m in members if m.user_id != instance.leader_id]
                members.append(
                    ChannelMember(
                        channel=channel,
                        user_id=instance.leader_id,
                        role="admin",
                    )
                )

            ChannelMember.objects.bulk_create(members, ignore_conflicts=True)
            logger.info(f"Auto-created team chat for {instance.name}")
