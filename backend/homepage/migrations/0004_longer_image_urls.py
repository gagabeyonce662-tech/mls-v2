from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("homepage", "0003_integrationsettings"),
    ]

    operations = [
        migrations.AlterField(
            model_name="communityimage",
            name="image_url",
            field=models.URLField(max_length=1000),
        ),
        migrations.AlterField(
            model_name="partner",
            name="logo_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
    ]
