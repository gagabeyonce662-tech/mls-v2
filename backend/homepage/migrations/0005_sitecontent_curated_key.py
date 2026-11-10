from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("homepage", "0004_longer_image_urls"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sitecontent",
            name="key",
            field=models.CharField(
                choices=[
                    ("homepage", "Homepage"),
                    ("chrome", "Header, footer, and contact"),
                    ("seo", "SEO"),
                    ("curated", "Keyword searches"),
                ],
                max_length=32,
                unique=True,
            ),
        ),
    ]
