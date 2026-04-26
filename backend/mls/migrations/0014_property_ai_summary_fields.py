from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0013_mapaggregatecell"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="ai_summary_markdown",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="property",
            name="ai_summary_payload_hash",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="property",
            name="ai_summary_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
