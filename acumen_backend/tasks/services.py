# acumen_backend/tasks/services.py
import logging
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from tasks.models import Task, TaskActivity, TaskMember, TaskComment, TaskAttachment
from workspaces.models import TeamMembership, Team
from notifications.services import NotificationService, TaskAssignedEvent

logger = logging.getLogger(__name__)


class TaskService:
    """
    Centralized service for all task state mutations.
    Views call these methods; they do not mutate ORM directly.
    """

    @staticmethod
    def _parse_due_date(raw):
        if not raw:
            return None
        from django.utils.dateparse import parse_datetime
        from datetime import datetime

        parsed = parse_datetime(raw)
        if parsed:
            if timezone.is_naive(parsed):
                return timezone.make_aware(parsed)
            return parsed
        try:
            return timezone.make_aware(datetime.strptime(raw, "%Y-%m-%d"))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _log_activity(task, action, performed_by, detail=""):
        TaskActivity.objects.create(
            task=task, action=action, performed_by=performed_by, detail=detail
        )

    @staticmethod
    @transaction.atomic
    def create_task(workspace, creator, data):
        title = (data.get("title") or "").strip()
        task_type = data.get("task_type", "personal")

        task = Task.objects.create(
            title=title,
            task_type=task_type,
            description=data.get("description", ""),
            priority=data.get("priority", "medium"),
            status="todo",
            due_date=TaskService._parse_due_date(data.get("due_date")),
            created_by=creator,
            workspace=workspace,
        )

        if task_type == "assigned":
            assigned_to_id = data.get("assigned_to")
            if not assigned_to_id:
                raise ValidationError({"assigned_to": "This field is required."})

            from django.contrib.auth.models import User

            try:
                assigned_to_user = User.objects.get(id=assigned_to_id)
            except User.DoesNotExist:
                raise ValidationError({"assigned_to": "User not found."})

            task.assigned_to = assigned_to_user
            task.save()
            TaskMember.objects.create(task=task, user=assigned_to_user, status="todo")

            TaskService._log_activity(
                task, "created", creator, f"Assigned to {assigned_to_user.username}"
            )

            # Emit Notification
            try:
                NotificationService.create_and_emit(
                    TaskAssignedEvent(
                        actor_id=creator.id,
                        workspace_id=workspace.id,
                        task_id=task.id,
                        task_title=task.title,
                        assignee_ids=[assigned_to_user.id],
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to emit TaskAssignedEvent: {e}")

        elif task_type == "team":
            team_id = data.get("team_id")
            if not team_id:
                raise ValidationError({"team_id": "This field is required."})

            try:
                team = Team.objects.get(id=team_id, workspace=workspace)
            except Team.DoesNotExist:
                raise ValidationError({"team_id": "Team not found."})

            task.team = team
            task.save()

            team_members = TeamMembership.objects.filter(team=team, is_active=True)
            members_to_create = [
                TaskMember(task=task, user=tm.user, status="todo")
                for tm in team_members
            ]
            TaskMember.objects.bulk_create(members_to_create)

            TaskService._log_activity(
                task, "created", creator, f"Assigned to team {team.name}"
            )

            # Emit Notification
            try:
                member_ids = list(team_members.values_list("user_id", flat=True))
                NotificationService.create_and_emit(
                    TaskAssignedEvent(
                        actor_id=creator.id,
                        workspace_id=workspace.id,
                        task_id=task.id,
                        task_title=task.title,
                        assignee_ids=member_ids,
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to emit TaskAssignedEvent: {e}")

        else:
            TaskService._log_activity(task, "created", creator, "Personal task created")

        return task

    @staticmethod
    @transaction.atomic
    def update_task(task, user, data):
        is_creator = task.created_by == user
        is_assignee = task.assigned_to == user

        new_status = data.get("status")

        if is_assignee and not is_creator:
            if new_status and new_status in ["todo", "in_progress", "completed"]:
                if new_status == "completed" and task.status != "completed":
                    # ENFORCE APPROVAL: If approval is required, assignee can only submit for approval.
                    if task.requires_approval and not task.is_approved:
                        task.status = "pending_approval"
                        task.save(update_fields=["status", "updated_at"])
                        TaskService._log_activity(task, "status_changed", user, "Submitted for approval")
                    else:
                        task.mark_completed(user)
                        TaskService._log_activity(task, "completed", user, "Task completed")
                elif new_status != "completed" and task.status == "completed":
                    task.reopen()
                    TaskService._log_activity(task, "reopened", user, "Task reopened")
                else:
                    task.status = new_status
                    task.save(update_fields=["status", "updated_at"])
                    TaskService._log_activity(
                        task, "status_changed", user, f"Status changed to {new_status}"
                    )
            else:
                raise ValidationError(
                    {"error": "Assignees can only update task status"}
                )

        elif is_creator:
            if new_status and new_status in [
                "todo",
                "in_progress",
                "completed",
                "pending_approval",
            ]:
                # Creators cannot manually mark as completed if approval is required.
                # They must use the approval flow or it must be approved first.
                if new_status == "completed" and task.requires_approval and not task.is_approved:
                    raise ValidationError({"error": "Task requires approval before completion"})
                elif new_status == "completed" and task.status != "completed":
                    task.mark_completed(user)
                    TaskService._log_activity(task, "completed", user, "Task completed")
                elif new_status != "completed" and task.status == "completed":
                    task.reopen()
                    TaskService._log_activity(task, "reopened", user, "Task reopened")
                else:
                    task.status = new_status
                    task.save(update_fields=["status", "updated_at"])
                    TaskService._log_activity(
                        task, "status_changed", user, f"Status changed to {new_status}"
                    )

            if "priority" in data:
                task.priority = data["priority"]
            if "title" in data:
                task.title = data["title"]
            if "description" in data:
                task.description = data["description"]
            if "due_date" in data:
                task.due_date = TaskService._parse_due_date(data["due_date"])
            task.save()
            TaskService._log_activity(task, "updated", user, "Task details updated")

        else:
            raise ValidationError({"error": "Not authorized"})

        return task

    @staticmethod
    @transaction.atomic
    def archive_task(task, user):
        task.is_archived = True
        task.save(update_fields=["is_archived", "updated_at"])
        TaskService._log_activity(task, "archived", user, "Task archived")
        return task

    @staticmethod
    @transaction.atomic
    def update_member_status(task_member, user, new_status):
        if new_status not in ["todo", "in_progress", "completed"]:
            raise ValidationError({"error": "Invalid status"})

        task_member.status = new_status
        if new_status == "completed":
            task_member.completed_at = timezone.now()
        else:
            task_member.completed_at = None
        task_member.save()
        return task_member

    @staticmethod
    @transaction.atomic
    def add_comment(task, user, message):
        comment = TaskComment.objects.create(task=task, author=user, message=message)
        TaskService._log_activity(task, "comment_added", user, "Added a comment")
        return comment

    @staticmethod
    @transaction.atomic
    def update_comment(comment, user, message):
        comment.message = message
        comment.save()
        return comment

    @staticmethod
    @transaction.atomic
    def delete_comment(comment, user):
        comment.is_deleted = True
        comment.deleted_at = timezone.now()
        comment.save()
        return comment

    @staticmethod
    @transaction.atomic
    def add_attachment(task, user, file_obj, file_name):
        attachment = TaskAttachment.objects.create(
            task=task, uploaded_by=user, file=file_obj, file_name=file_name
        )
        TaskService._log_activity(
            task, "attachment_uploaded", user, f"Uploaded {file_name}"
        )
        return attachment

    @staticmethod
    @transaction.atomic
    def delete_attachment(attachment, user):
        attachment.is_deleted = True
        attachment.deleted_at = timezone.now()
        attachment.save()
        # Keep file on disk for audit, but hide from UI
        return attachment

    @staticmethod
    @transaction.atomic
    def approve_task(task, user):
        if task.status != "pending_approval":
            raise ValidationError({"error": "Task is not pending approval"})

        task.is_approved = True
        task.approved_by = user
        task.approved_at = timezone.now()
        task.mark_completed(user)
        TaskService._log_activity(task, "approved", user, "Task approved and completed")
        return task

    @staticmethod
    @transaction.atomic
    def reject_task(task, user):
        if task.status != "pending_approval":
            raise ValidationError({"error": "Task is not pending approval"})

        task.is_approved = False
        task.approved_by = user
        task.approved_at = timezone.now()
        task.status = "in_progress"
        task.save(
            update_fields=[
                "is_approved",
                "approved_by",
                "approved_at",
                "status",
                "updated_at",
            ]
        )
        TaskService._log_activity(
            task, "rejected", user, "Task rejected, moved back to In Progress"
        )
        return task
