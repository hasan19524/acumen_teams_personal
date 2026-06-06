from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workspaces", "0007_privategroupinvite"),
    ]

    operations = [
        # Remove unique_together from TeamInvite
        migrations.AlterUniqueTogether(
            name="teaminvite",
            unique_together=set(),
        ),
        # Add index for fast lookups
        migrations.AddIndex(
            model_name="teaminvite",
            index=models.Index(
                fields=["team", "invitee", "workspace", "status"],
                name="idx_teaminvite_lookup",
            ),
        ),
        # Remove unique_together from PrivateGroupInvite
        migrations.AlterUniqueTogether(
            name="privategroupinvite",
            unique_together=set(),
        ),
        # Add index for fast lookups
        migrations.AddIndex(
            model_name="privategroupinvite",
            index=models.Index(
                fields=["channel", "invitee", "workspace", "status"],
                name="idx_groupinvite_lookup",
            ),
        ),
    ]
