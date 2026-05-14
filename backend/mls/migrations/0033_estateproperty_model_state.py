# Generated manually to register EstateProperty as a first-class Django model
# without changing the existing database table.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0032_estateproperty_description_sections"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="EstateProperty",
                    fields=[
                        ("id", models.BigAutoField(primary_key=True, serialize=False)),
                        ("listing_key", models.CharField(max_length=2000, unique=True)),
                        ("listing_id", models.CharField(blank=True, max_length=2000, null=True)),
                        ("property_title", models.TextField(blank=True, null=True)),
                        ("property_slug", models.CharField(blank=True, max_length=255, null=True)),
                        ("publish_status", models.CharField(blank=True, default="draft", max_length=32, null=True)),
                        ("property_description", models.TextField(blank=True, null=True)),
                        ("featured_image_url", models.TextField(blank=True, null=True)),
                        ("listing_url", models.URLField(blank=True, null=True)),
                        ("expires_at", models.DateTimeField(blank=True, null=True)),
                        ("list_price", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                        ("second_price", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                        ("enable_price_placeholder", models.BooleanField(default=False)),
                        ("price_placeholder", models.CharField(blank=True, max_length=255, null=True)),
                        ("price_prefix", models.CharField(blank=True, max_length=255, null=True)),
                        ("after_price", models.CharField(blank=True, max_length=255, null=True)),
                        ("building_area_total", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                        ("size_postfix", models.CharField(blank=True, max_length=64, null=True)),
                        ("land_area", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                        ("land_area_size_postfix", models.CharField(blank=True, max_length=64, null=True)),
                        ("bedrooms_total", models.IntegerField(blank=True, null=True)),
                        ("rooms", models.IntegerField(blank=True, null=True)),
                        ("bathrooms_total_integer", models.IntegerField(blank=True, null=True)),
                        ("garages", models.IntegerField(blank=True, null=True)),
                        ("garage_size", models.CharField(blank=True, max_length=128, null=True)),
                        ("year_built", models.IntegerField(blank=True, null=True)),
                        ("property_id_code", models.CharField(blank=True, max_length=128, null=True)),
                        ("max_bedrooms", models.IntegerField(blank=True, null=True)),
                        ("developer", models.TextField(blank=True, null=True)),
                        ("occupancy_year", models.IntegerField(blank=True, null=True)),
                        ("signing_amount", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                        ("lot_size", models.CharField(blank=True, max_length=128, null=True)),
                        ("kitchens", models.IntegerField(blank=True, null=True)),
                        ("tax_annual_amount", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                        ("tax_year", models.IntegerField(blank=True, null=True)),
                        ("basement", models.TextField(blank=True, null=True)),
                        ("exterior_features", models.TextField(blank=True, null=True)),
                        ("unparsed_address", models.CharField(blank=True, max_length=2000, null=True)),
                        ("city", models.CharField(blank=True, max_length=2000, null=True)),
                        ("state_or_province", models.CharField(blank=True, max_length=2000, null=True)),
                        ("postal_code", models.CharField(blank=True, max_length=20, null=True)),
                        ("country", models.CharField(blank=True, max_length=50, null=True)),
                        ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                        ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                        ("standard_status", models.CharField(blank=True, max_length=50, null=True)),
                        ("modification_timestamp", models.DateTimeField(blank=True, null=True)),
                        ("is_featured", models.BooleanField(default=False)),
                        ("wp_meta_json", models.JSONField(blank=True, default=dict)),
                        ("wp_terms_json", models.JSONField(blank=True, default=dict)),
                        ("wp_post_json", models.JSONField(blank=True, default=dict)),
                        ("description_sections_json", models.JSONField(blank=True, default=list)),
                    ],
                    options={
                        "db_table": "mls_estateproperty",
                        "managed": False,
                    },
                ),
            ],
        ),
    ]

