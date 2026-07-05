# chat/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Channel,
    ChannelMember,
    Message,
    MessageAttachment,
    Reaction,
    MessageRead,
)

# ── User & Channel Serializers ────────────────────────────────────────────────


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name", "profile_image"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_profile_image(self, obj):
        # Safely fetch the profile image URL if it exists
        if hasattr(obj, 'profile') and obj.profile.profile_image:
            request = self.context.get("request")
            try:
                url = obj.profile.profile_image.url
                if request:
                    return request.build_absolute_uri(url)
                from django.conf import settings
                return f"{settings.BASE_URL}{url}"
            except Exception:
                return None
        return None


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    # For DM channels, expose the "other" user's info
    dm_partner = serializers.SerializerMethodField()
    # Expose membership status so frontend knows if user has read-only or full access
    is_member_active = serializers.SerializerMethodField()
    # Owner details for private groups (raw FK is useless for frontend)
    owner_details = UserMiniSerializer(source="owner", read_only=True, default=None)
    # Team context for sidebar grouping
    team_name = serializers.CharField(source="team.name", read_only=True, default=None)
    
    # NEW: Sidebar preview fields
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    last_message_sender = serializers.CharField(read_only=True, default=None)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = [
            "id",
            "name",
            "slug",
            "is_private",
            "is_dm",
            "channel_type",
            "owner",
            "owner_details",
            "workspace",
            "team",
            "team_name",
            "created_by",
            "created_at",
            "member_count",
            "dm_partner",
            "is_member_active",
            "is_pending",
            "last_message",
            "last_message_time",
            "last_message_sender",
            "unread_count",
        ]

    def get_last_message(self, obj):
        # Use annotated field if available (from the view), otherwise fallback to query
        if hasattr(obj, 'last_message_content'):
            if not obj.last_message_content:
                return None
            if obj.last_message_content:
                return obj.last_message_content
            return "📎 Attachment" # Fallback if content is empty but message exists
        
        # Fallback for single object retrieves (e.g., DM creation)
        last_msg = Message.objects.filter(channel=obj, is_deleted=False).order_by("-created_at").first()
        if not last_msg: return None
        if last_msg.content: return last_msg.content
        if last_msg.attachments.exists(): return "📎 Attachment"
        return ""

    def get_last_message_time(self, obj):
        # Return raw ISO string so the frontend can format it in the user's local timezone
        if hasattr(obj, 'last_message_created'):
            return obj.last_message_created.isoformat() if obj.last_message_created else None
        
        last_msg = Message.objects.filter(channel=obj, is_deleted=False).order_by("-created_at").first()
        return last_msg.created_at.isoformat() if last_msg else None

    def get_unread_count(self, obj):
        # Use annotated field if available
        if hasattr(obj, 'unread_count'):
            return obj.unread_count
            
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return Message.objects.filter(
            channel=obj
        ).exclude(
            sender=request.user
        ).exclude(
            reads__user=request.user
        ).count()



    def get_dm_partner(self, obj):
        if not obj.is_dm:
            return None
        request = self.context.get("request")
        if not request:
            return None
        other = (
            ChannelMember.objects.filter(channel=obj, is_active=True)
            .exclude(user=request.user)
            .select_related("user")
            .first()
        )
        if other:
            # FIX: Pass context so it generates a valid presigned S3 URL
            return UserMiniSerializer(other.user, context={"request": request}).data
        return None

    def get_is_member_active(self, obj):
        """Checks if the current user is an active member of this channel."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return ChannelMember.objects.filter(
            channel=obj, user=request.user, is_active=True
        ).exists()


# ── Message & Attachment Serializers ──────────────────────────────────────────


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializes file metadata and generates a full URL for the frontend.
    """

    # FileField by default just returns the relative path. We need the full URL.
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MessageAttachment
        fields = ["id", "file_url", "original_filename", "file_type", "file_size"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        from django.conf import settings

        return f"{settings.BASE_URL}{obj.file.url}"


class ReplyToSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the nested reply_to preview.
    Used inside MessageSerializer for reading only.
    Maps the DB's parent_message FK to the API's reply_to object.
    """

    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender = UserMiniSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ["id", "content", "sender", "sender_name", "is_deleted", "attachments"]


class ReactionSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "emoji", "created_at"]


class MessageReadSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = MessageRead
        fields = ["user", "read_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    created_time = serializers.DateTimeField(
        source="created_at",
        format="%I:%M %p",
        read_only=True,
    )

    # Use the safe_content property so soft-deleted messages return "[Message deleted]"
    display_content = serializers.CharField(source="safe_content", read_only=True)

    # Nested attachments (allows multiple files per message)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    # Reactions & Read Receipts
    reactions = ReactionSerializer(many=True, read_only=True)
    reads = MessageReadSerializer(many=True, read_only=True)

    # ── Reply system contract ────────────────────────────────────────────
    # READ: nested object via parent_message FK
    reply_to = ReplyToSerializer(source="parent_message", read_only=True)
    # WRITE: accept reply_to_id from frontend, map to parent_message_id DB column
    reply_to_id = serializers.IntegerField(
        source="parent_message_id",
        write_only=True,
        required=False,
        allow_null=True,
        default=None,
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "channel",
            "sender",
            "sender_name",
            "content",
            "display_content",
            "client_id",
            "is_edited",
            "edited_at",
            "is_deleted",
            "reply_to",  # NEW: read — nested object
            "reply_to_id",  # NEW: write — maps to parent_message_id
            "attachments",
            "reactions",
            "reads",
            "created_at",
            "created_time",
        ]
        # Content is writable (for creating/editing), but edit/delete tracking is read-only
        read_only_fields = ["is_edited", "edited_at", "is_deleted"]
