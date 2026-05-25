from django.contrib import admin
from .models import Channel, ChannelMember, Message, DMRequest, Block, Report


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ["name", "workspace", "team", "is_dm", "is_private", "created_at"]
    list_filter = ["is_dm", "is_private", "workspace"]
    search_fields = ["name", "slug"]


@admin.register(ChannelMember)
class ChannelMemberAdmin(admin.ModelAdmin):
    list_display = ["channel", "user", "role", "joined_at"]
    list_filter = ["role"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["sender", "channel", "created_at", "is_edited"]
    list_filter = ["is_edited"]
    search_fields = ["content", "sender__username"]


@admin.register(DMRequest)
class DMRequestAdmin(admin.ModelAdmin):
    list_display = ["sender", "receiver", "workspace", "status", "created_at"]
    list_filter = ["status", "workspace"]


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ["blocker", "blocked", "workspace", "created_at"]
    list_filter = ["workspace"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["reporter", "report_type", "workspace", "status", "created_at"]
    list_filter = ["report_type", "status", "workspace"]
    search_fields = ["reason", "reporter__username"]
