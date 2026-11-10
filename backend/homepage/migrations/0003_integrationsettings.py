from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("homepage", "0002_sitecontent"),
    ]

    operations = [
        migrations.CreateModel(
            name="IntegrationSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("values", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "integration settings",
                "verbose_name_plural": "integration settings",
            },
        ),
    ]
