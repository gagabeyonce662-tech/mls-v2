from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("mls", "0012_media_media_file_property_is_featured_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="MapAggregateCell",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("h3_index", models.CharField(max_length=32)),
                ("resolution", models.PositiveSmallIntegerField()),
                ("property_count", models.PositiveIntegerField(default=0)),
                ("center_lat", models.DecimalField(decimal_places=6, max_digits=10)),
                ("center_lng", models.DecimalField(decimal_places=6, max_digits=10)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "unique_together": {("resolution", "h3_index")},
            },
        ),
        migrations.AddIndex(
            model_name="mapaggregatecell",
            index=models.Index(
                fields=["resolution", "h3_index"],
                name="mls_mapaggr_resolut_52c0de_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="mapaggregatecell",
            index=models.Index(
                fields=["resolution", "updated_at"],
                name="mls_mapaggr_resolut_af2b7b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="mapaggregatecell",
            index=models.Index(
                fields=["resolution", "center_lat", "center_lng"],
                name="mls_mapaggr_resolut_0df091_idx",
            ),
        ),
    ]
