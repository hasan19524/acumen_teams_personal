# acumen_backend/chat/services/chat_service.py
import logging
from uuid import uuid4
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from django.core.exceptions import ValidationError

from chat.models import (
    Channel,
    ChannelMember,
    Message,
    MessageAttachment,
    Reaction,
    MessageRead,
)
from workspaces.models import TeamMembership
from notifications.services import NotificationService, ChatCreatedEvent

logger = logging.getLogger(__name__)


class ChatService:
    """
    Centralized service for all communication state mutations.
    Views and Consumers call these methods; they do not mutate ORM directly.
    """

    @staticmethod
    @transaction.atomic
    def create_channel(workspace, creator, name, channel_type, team=None):
        # Prevent duplicate Official channels in the same workspace
        if channel_type == "official":
            existing = Channel.objects.filter(
                workspace=workspace, 
                name__iexact=name, 
                channel_type="official"
            ).first()
            if existing:
                return existing

        slug = slugify(name)
        if Channel.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid4().hex[:6]}"

        is_pending = channel_type == "private_group"

        channel = Channel.objects.create(
            name=name,
            slug=slug,
            created_by=creator,
            workspace=workspace,
            team=team,
            channel_type=channel_type,
            owner=creator if channel_type == "private_group" else None,
            is_pending=is_pending,
        )

        member_users = []
        if team:
            member_users = list(
                TeamMembership.objects.filter(team=team, is_active=True).values_list(
                    "user_id", flat=True
                )
            )
            ChannelMember.objects.bulk_create(
                [
                    ChannelMember(channel=channel, user_id=uid, role="member")
                    for uid in member_users
                ],
                ignore_conflicts=True,
            )

        ChannelMember.objects.get_or_create(
            channel=channel, user=creator, defaults={"role": "admin", "is_active": True}
        )

        try:
            NotificationService.create_and_emit(
                ChatCreatedEvent(
                    actor_id=creator.id,
                    workspace_id=workspace.id,
                    channel_id=channel.id,
                    channel_name=channel.name,
                    member_ids=member_users,
                )
            )
        except Exception as e:
            logger.warning(f"Failed to emit ChatCreatedEvent: {e}")

        return channel

    @staticmethod
    @transaction.atomic
    def add_channel_member(channel, user):
        member, created = ChannelMember.objects.update_or_create(
            channel=channel,
            user=user,
            defaults={"role": "member", "is_active": True, "left_at": None},
        )
        # If joining an official team chat, ensure they are in the team
        if channel.channel_type == "team" and channel.team:
            TeamMembership.objects.update_or_create(
                team=channel.team,
                user=user,
                defaults={"is_active": True, "left_at": None},
            )
        return member

    @staticmethod
    @transaction.atomic
    def remove_channel_member(channel, user):
        updated = ChannelMember.objects.filter(
            channel=channel, user=user, is_active=True
        ).update(is_active=False, left_at=timezone.now())

        if updated:
            # If leaving an official team chat, soft-delete team membership
            if channel.channel_type == "team" and channel.team:
                TeamMembership.objects.filter(
                    user=user, team=channel.team, is_active=True
                ).update(is_active=False, left_at=timezone.now())

        return updated > 0

    @staticmethod
    @transaction.atomic
    def create_dm(workspace, sender, receiver):
        slug = f"dm-{min(sender.id, receiver.id)}-{max(sender.id, receiver.id)}"
        if Channel.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid4().hex[:4]}"

        dm = Channel.objects.create(
            name=f"{sender.username},{receiver.username}",
            slug=slug,
            is_dm=True,
            channel_type="dm",
            created_by=sender,
            workspace=workspace,
        )
        ChannelMember.objects.bulk_create(
            [
                ChannelMember(channel=dm, user=sender, role="member"),
                ChannelMember(channel=dm, user=receiver, role="member"),
            ]
        )
        return dm

    @staticmethod
    @transaction.atomic
    def save_message(channel, sender, content, client_id=None, parent_message_id=None):
        if client_id:
            existing = Message.objects.filter(
                channel_id=channel.id, client_id=client_id
            ).first()
            if existing:
                return existing

        msg = Message.objects.create(
            channel=channel,
            sender=sender,
            content=content,
            client_id=client_id,
            parent_message_id=parent_message_id,
        )
        return msg

    @staticmethod
    @transaction.atomic
    def save_file_message(channel, sender, files, client_id=None):
        from chat.services.file_service import validate_file_upload

        if client_id:
            existing = Message.objects.filter(
                channel_id=channel.id, client_id=client_id
            ).first()
            if existing:
                return existing

        message = Message.objects.create(
            channel_id=channel.id, sender=sender, content="", client_id=client_id
        )

        saved_attachments = []
        for file_obj in files:
            ext, mime_type = validate_file_upload(file_obj)
            attachment = MessageAttachment.objects.create(
                message=message,
                file=file_obj,
                original_filename=file_obj.name,
                file_type=mime_type,
                file_size=file_obj.size,
            )
            saved_attachments.append(attachment)

        if not saved_attachments:
            raise ValidationError("All files failed validation")

        return message

    @staticmethod
    @transaction.atomic
    def edit_message(message, content):
        message.content = content
        message.is_edited = True
        message.edited_at = timezone.now()
        message.save()
        return message

    @staticmethod
    @transaction.atomic
    def soft_delete_message(message):
        message.is_deleted = True
        message.content = ""  # Wipe PII for privacy compliance
        message.save()
        return message

    @staticmethod
    @transaction.atomic
    def toggle_reaction(message, user, emoji):
        existing = Reaction.objects.filter(
            message=message, user=user, emoji=emoji
        ).first()
        if existing:
            existing.delete()
            return None, False
        else:
            reaction = Reaction.objects.create(message=message, user=user, emoji=emoji)
            return reaction, True

    @staticmethod
    @transaction.atomic
    def mark_message_read(message, user):
        read, created = MessageRead.objects.get_or_create(message=message, user=user)
        return read, created

    # Append these methods to the ChatService class in chat_service.py

    @staticmethod
    @transaction.atomic
    def create_dm_request(workspace, sender, receiver, initial_message):
        from chat.models import DMRequest
        from datetime import timedelta
        from django.utils import timezone

        # Check for active pending request
        if DMRequest.objects.filter(
            sender=sender, receiver=receiver, workspace=workspace, status="pending"
        ).exists():
            raise ValueError("DM request already pending")

        # Check for cooldown
        now = timezone.now()
        if DMRequest.objects.filter(
            sender=sender,
            receiver=receiver,
            workspace=workspace,
            status="rejected",
            cooldown_until__gt=now,
        ).exists():
            raise ValueError(
                "You must wait before sending another DM request to this user"
            )

        dm_request = DMRequest.objects.create(
            sender=sender,
            receiver=receiver,
            workspace=workspace,
            status="pending",
            initial_message=initial_message,
            expires_at=now + timedelta(days=10),
        )
        return dm_request

    @staticmethod
    @transaction.atomic
    def respond_to_dm_request(dm_request, responder, new_status):
        from chat.models import Channel, ChannelMember
        from datetime import timedelta
        from django.utils import timezone

        if dm_request.status != "pending":
            raise ValueError(f"DM request is already {dm_request.status}")

        if new_status == "accepted":
            # Reuse existing DM channel or create new one
            dm_channel = (
                Channel.objects.filter(
                    workspace=dm_request.workspace,
                    is_dm=True,
                    members__user=responder,
                    members__is_active=True,
                )
                .filter(members__user=dm_request.sender, members__is_active=True)
                .distinct()
                .first()
            )

            if not dm_channel:
                dm_channel = ChatService.create_dm(
                    workspace=dm_request.workspace,
                    sender=dm_request.sender,
                    receiver=responder,
                )

            dm_request.dm_channel = dm_channel
            dm_request.status = "accepted"

        elif new_status == "rejected":
            now = timezone.now()
            dm_request.status = "rejected"
            dm_request.rejected_at = now
            dm_request.cooldown_until = now + timedelta(days=31)

        dm_request.save()
        return dm_request

    @staticmethod
    @transaction.atomic
    def undo_dm_request(dm_request):
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.now()
        dm_request.status = "pending"
        dm_request.rejected_at = None
        dm_request.cooldown_until = None
        dm_request.expires_at = now + timedelta(days=10)
        dm_request.save()
        return dm_request

    @staticmethod
    @transaction.atomic
    def create_block(workspace, blocker, blocked_id):
        from chat.models import Block

        block, created = Block.objects.get_or_create(
            blocker=blocker, blocked_id=blocked_id, workspace=workspace
        )
        return created

    @staticmethod
    @transaction.atomic
    def remove_block(workspace, blocker, blocked_id):
        from chat.models import Block

        deleted, _ = Block.objects.filter(
            blocker=blocker, blocked_id=blocked_id, workspace=workspace
        ).delete()
        return deleted > 0

    @staticmethod
    @transaction.atomic
    def create_report(workspace, reporter, data):
        from chat.models import Report, Message
        from workspaces.models import WorkspaceMembership

        report_type = data.get("report_type")
        reason = (data.get("reason") or "").strip()
        reported_message = None
        reported_user = None

        if report_type == "message":
            message_id = data.get("message_id")
            reported_message = Message.objects.get(
                id=message_id, channel__workspace=workspace
            )
        elif report_type == "user":
            user_id = data.get("user_id")
            target = WorkspaceMembership.objects.get(
                user_id=user_id, workspace=workspace, is_active=True
            )
            reported_user = target.user

        report = Report.objects.create(
            reporter=reporter,
            workspace=workspace,
            report_type=report_type,
            reason=reason,
            reported_message=reported_message,
            reported_user=reported_user,
        )
        return report
