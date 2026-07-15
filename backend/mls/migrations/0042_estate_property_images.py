from django.db import migrations, models
import django.db.models.deletion
import mls.models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0041_repair_estate_source_snapshot"),
    ]

    operations = [
        # EstateProperty is deliberately unmanaged because the table predates
        # Django. Keep this production-owned table change explicit and additive.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    "ALTER TABLE mls_estateproperty ADD COLUMN IF NOT EXISTS featured_image varchar(100) NULL;",
                    migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="estateproperty",
                    name="featured_image",
                    field=models.ImageField(blank=True, null=True, upload_to="mls/estate-properties/featured"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EstatePropertyImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to=mls.models.estate_gallery_upload_path, validators=[mls.models.validate_estate_image])),
                ("caption", models.CharField(blank=True, max_length=500)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "estate_property",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gallery_images",
                        to="mls.estateproperty",
                    ),
                ),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
    ]
