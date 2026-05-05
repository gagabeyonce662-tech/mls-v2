from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("mls", "0024_propertysoldproxy_agent_agentservicearea"),
    ]

    operations = [
        migrations.CreateModel(
            name="SearchEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_key", models.CharField(blank=True, db_index=True, max_length=64)),
                ("query", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, max_length=255)),
                ("filters_json", models.JSONField(blank=True, default=dict)),
                ("result_count", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="search_events", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["user", "created_at"], name="mls_searchev_user_id_24edce_idx"),
                    models.Index(fields=["session_key", "created_at"], name="mls_searchev_session_46f2fe_idx"),
                    models.Index(fields=["city", "created_at"], name="mls_searchev_city_3f479c_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="UserPropertyInteraction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("listing_key", models.CharField(db_index=True, max_length=2000)),
                ("session_key", models.CharField(blank=True, db_index=True, max_length=64)),
                ("event_type", models.CharField(choices=[("view", "View"), ("favorite", "Favorite"), ("history", "History"), ("toured", "Toured"), ("inquiry_click", "Inquiry Click"), ("detail_open", "Detail Open")], db_index=True, max_length=32)),
                ("source", models.CharField(blank=True, default="web", max_length=64)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_interactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["event_type", "created_at"], name="mls_userprop_event_t_9071e9_idx"),
                    models.Index(fields=["user", "event_type", "created_at"], name="mls_userprop_user_id_cf2a28_idx"),
                    models.Index(fields=["session_key", "event_type", "created_at"], name="mls_userprop_session_ab4e6d_idx"),
                    models.Index(fields=["listing_key", "event_type", "created_at"], name="mls_userprop_listing_e4ef5c_idx"),
                ],
            },
        ),
    ]
