# Generated manually for valuation / HouseSigma parity

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0023_rename_mls_communi_communi_090667_idx_mls_communi_communi_1989bb_idx"),
    ]

    operations = [
        migrations.CreateModel(
            name="Agent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("photo_url", models.URLField(blank=True, max_length=2000, null=True)),
                ("brokerage", models.CharField(blank=True, max_length=255)),
                ("bio", models.TextField(blank=True)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="PropertySoldProxy",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("listing_key", models.CharField(db_index=True, max_length=2000, unique=True)),
                ("last_list_price", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ("sold_at_proxy", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("fsa", models.CharField(blank=True, db_index=True, max_length=3)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                ("bedrooms_total", models.IntegerField(blank=True, null=True)),
                ("bathrooms_total_integer", models.IntegerField(blank=True, null=True)),
                ("bathrooms_partial", models.IntegerField(blank=True, null=True)),
                ("bedrooms_below_grade", models.IntegerField(blank=True, null=True)),
                ("living_area", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("property_sub_type", models.CharField(blank=True, max_length=2000, null=True)),
                ("lot_size_area", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("frontage_length_numeric", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("parking_total", models.IntegerField(blank=True, null=True)),
                ("tax_annual_amount", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ("city", models.CharField(blank=True, max_length=2000, null=True)),
                ("city_region", models.CharField(blank=True, max_length=2000, null=True)),
                ("unparsed_address", models.CharField(blank=True, max_length=2000, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["fsa", "sold_at_proxy"], name="mls_propert_fsa_0a8b8d_idx"),
                    models.Index(fields=["latitude", "longitude"], name="mls_propert_latitud_8f1c2e_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="AgentServiceArea",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("fsa", "FSA (first 3 of postal)"), ("city", "City"), ("region", "City region / board area")], db_index=True, max_length=20)),
                ("key", models.CharField(db_index=True, help_text="FSA code (3 chars), normalized city name, or region slug", max_length=255)),
                ("agent", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="service_areas", to="mls.agent")),
            ],
            options={
                "indexes": [models.Index(fields=["kind", "key"], name="mls_agentser_kind_3e4f5a_idx")],
            },
        ),
        migrations.AddConstraint(
            model_name="agentservicearea",
            constraint=models.UniqueConstraint(fields=("agent", "kind", "key"), name="uniq_agent_service_area"),
        ),
    ]
