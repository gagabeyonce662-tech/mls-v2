"""Backs the BACKEND_API_REQUESTS_FINAL punch-list.

* Property.virtual_tour_url                  - GAP-36
* PropertyInquiry.project / is_vip_list /
  newsletter_opt_in                          - GAP-14
* SavedSearch model                          - GAP-03
"""
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0052_api_gaps_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="virtual_tour_url",
            field=models.URLField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name="propertyinquiry",
            name="project",
            field=models.ForeignKey(
                blank=True,
                db_index=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="inquiries",
                to="mls.estateproject",
            ),
        ),
        migrations.AddField(
            model_name="propertyinquiry",
            name="is_vip_list",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="propertyinquiry",
            name="newsletter_opt_in",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="SavedSearch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("filters_json", models.JSONField(blank=True, default=dict)),
                (
                    "alert_cadence",
                    models.CharField(
                        choices=[
                            ("off", "Off"),
                            ("instant", "Instant"),
                            ("daily", "Daily digest"),
                            ("weekly", "Weekly digest"),
                        ],
                        default="off",
                        max_length=16,
                    ),
                ),
                ("last_run_at", models.DateTimeField(blank=True, null=True)),
                ("last_alert_sent_at", models.DateTimeField(blank=True, null=True)),
                ("last_result_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="saved_searches",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="savedsearch",
            constraint=models.UniqueConstraint(
                fields=("user", "name"), name="uniq_savedsearch_user_name"
            ),
        ),
        migrations.AddIndex(
            model_name="savedsearch",
            index=models.Index(fields=["user", "-updated_at"], name="mls_savedse_user_id_fd7b58_idx"),
        ),
        migrations.AddIndex(
            model_name="savedsearch",
            index=models.Index(
                fields=["alert_cadence", "last_alert_sent_at"],
                name="mls_savedse_alert_c_59cbca_idx",
            ),
        ),
    ]
