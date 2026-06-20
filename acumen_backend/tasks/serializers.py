from rest_framework import serializers
from .models import Task, TaskActivity, TaskMember, TaskComment, TaskAttachment
from django.contrib.auth.models import User
from django.utils import timezone


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class TaskActivitySerializer(serializers.ModelSerializer):
    performed_by_details = UserMiniSerializer(source="performed_by", read_only=True)

    class Meta:
        model = TaskActivity
        fields = [
            "id",
            "action",
            "performed_by",
            "performed_by_details",
            "detail",
            "created_at",
        ]


class TaskMemberSerializer(serializers.ModelSerializer):
    user_details = UserMiniSerializer(source="user", read_only=True)

    class Meta:
        model = TaskMember
        fields = ["id", "user", "user_details", "status", "completed_at"]


class TaskCommentSerializer(serializers.ModelSerializer):
    author_details = UserMiniSerializer(source="author", read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            "id",
            "task",
            "author",
            "author_details",
            "message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserMiniSerializer(source="uploaded_by", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = [
            "id",
            "task",
            "uploaded_by",
            "uploaded_by_details",
            "file",
            "file_url",
            "file_name",
            "created_at",
        ]
        read_only_fields = ["uploaded_by", "created_at"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class TaskSerializer(serializers.ModelSerializer):
    created_by_details = UserMiniSerializer(source="created_by", read_only=True)
    assigned_to_details = UserMiniSerializer(source="assigned_to", read_only=True)
    completed_by_details = UserMiniSerializer(source="completed_by", read_only=True)
    activities = TaskActivitySerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()

    team_progress = serializers.SerializerMethodField()
    task_members = TaskMemberSerializer(many=True, read_only=True)
    team_details = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    approved_by_details = UserMiniSerializer(source="approved_by", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "workspace",
            "title",
            "description",
            "task_type",
            "created_by",
            "created_by_details",
            "assigned_to",
            "assigned_to_details",
            "status",
            "priority",
            "due_date",
            "is_archived",
            "team",
            "team_details",
            "requires_approval",
            "is_approved",
            "approved_by",
            "approved_by_details",
            "approved_at",
            "assignee_name",
            "completed_by",
            "completed_by_details",
            "completed_at",
            "updated_at",
            "is_overdue",
            "activities",
            "task_members",
            "team_progress",
            "comments",
            "attachments",
        ]
        read_only_fields = ["created_by", "is_archived", "created_at", "updated_at"]

    def get_is_overdue(self, obj):
        if not obj.due_date or obj.status not in ["todo", "in_progress"]:
            return False
        if isinstance(obj.due_date, str):
            from django.utils.dateparse import parse_datetime
            obj.due_date = parse_datetime(obj.due_date)
        if not obj.due_date:
            return False
        return timezone.now() > obj.due_date

    def get_team_details(self, obj):
        if obj.team:
            return {"id": obj.team.id, "name": obj.team.name}
        return None

    def get_team_progress(self, obj):
        if obj.task_type == "team":
            members = obj.members.all()
            total = members.count()
            completed = members.filter(status="completed").count()
            in_progress = members.filter(status="in_progress").count()
            todo = members.filter(status="todo").count()
            percentage = (completed / total * 100) if total > 0 else 0
            return {
                "total": total,
                "completed": completed,
                "in_progress": in_progress,
                "todo": todo,
                "percentage": round(percentage, 1),
            }
        return None


# --- LIST SERIALIZER (Lightweight, for list views) ---
class TaskListSerializer(serializers.ModelSerializer):
    created_by_details = UserMiniSerializer(source="created_by", read_only=True)
    assigned_to_details = UserMiniSerializer(source="assigned_to", read_only=True)
    team_details = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "workspace", "title", "description", "task_type", 
            "created_by", "created_by_details", "assigned_to", "assigned_to_details", 
            "status", "priority", "due_date", "is_archived", "team", "team_details", 
            "requires_approval", "is_approved", "approved_by", "approved_at", 
            "assignee_name", "completed_by", "completed_at", "updated_at", 
            "is_overdue", "comment_count", "attachment_count"
        ]

    def get_team_details(self, obj):
        if obj.team:
            return {"id": obj.team.id, "name": obj.team.name}
        return None

    def get_is_overdue(self, obj):
        if not obj.due_date or obj.status not in ["todo", "in_progress"]:
            return False
        if isinstance(obj.due_date, str):
            from django.utils.dateparse import parse_datetime
            obj.due_date = parse_datetime(obj.due_date)
        if not obj.due_date:
            return False
        return timezone.now() > obj.due_date