from django.db import migrations, models


def fix_team_channel_types(apps, schema_editor):
    Channel = apps.get_model("chat", "Channel")
    # Any channel linked to a team with channel_type="official" should be "team"
    Channel.objects.filter(team__isnull=False, channel_type="official").update(
        channel_type="team"
    )


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0014_alter_dmrequest_unique_together_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="channel",
            name="is_pending",
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text="True for private groups that haven't activated yet (creator + 1 member required).",
            ),
        ),
        migrations.RunPython(fix_team_channel_types, migrations.RunPython.noop),
    ]
