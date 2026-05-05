from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0020_listing_depth_features"),
    ]

    operations = [
        migrations.CreateModel(
            name="CommunityListing",
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
                ("community_name", models.CharField(max_length=255)),
                ("community_slug", models.SlugField(db_index=True, max_length=255)),
                ("badge", models.CharField(blank=True, default="", max_length=120)),
                ("rank", models.PositiveIntegerField(db_index=True, default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="community_listings",
                        to="mls.property",
                    ),
                ),
            ],
            options={
                "ordering": ["rank", "-updated_at"],
                "indexes": [
                    models.Index(
                        fields=["community_slug", "is_published", "rank"],
                        name="mls_communi_communi_090667_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("community_slug", "property"),
                        name="uniq_communitylisting_slug_property",
                    ),
                ],
            },
        ),
    ]
