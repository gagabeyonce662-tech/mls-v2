from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0060_listing_submission_assignment_extras"),
    ]

    operations = [
        migrations.AddField(
            model_name="precomproperty",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
    ]
