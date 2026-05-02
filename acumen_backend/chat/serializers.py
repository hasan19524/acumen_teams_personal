from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Channel, ChannelMember, Message


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = "__all__"

    def get_member_count(self, obj):
        return obj.members.count()


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    created_time = serializers.DateTimeField(
        source="created_at",
        format="%I:%M %p",
        read_only=True
    )

    class Meta:
        model = Message
        fields = "__all__"