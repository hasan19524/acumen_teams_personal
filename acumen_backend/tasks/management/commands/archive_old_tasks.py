from django.core.management.base import BaseCommand
from django.utils import timezone
from tasks.models import Task, TaskActivity


class Command(BaseCommand):
    help = (
        "Automatically archives tasks that have been completed for more than 7 weeks."
    )

    def handle(self, *args, **options):
        now = timezone.now()

        # Find tasks ready to be archived
        tasks_to_archive = Task.objects.filter(
            is_archived=False, is_deleted=False, archive_after__lte=now
        )

        count = 0
        for task in tasks_to_archive:
            task.is_archived = True
            task.save(update_fields=["is_archived", "updated_at"])

            # Log activity
            TaskActivity.objects.create(
                task=task,
                action="archived",
                detail="Automatically archived after 7 weeks of completion.",
                created_at=now,
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully archived {count} tasks."))
