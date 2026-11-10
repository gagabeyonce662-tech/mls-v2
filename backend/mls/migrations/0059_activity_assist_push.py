from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0058_request_meta_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PreconActivityEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event", models.CharField(choices=[("view", "Page view"), ("floor_plans", "Floor plans"), ("pricing", "Pricing"), ("contact", "Contact")], db_index=True, max_length=32)),
                ("session_key", models.CharField(blank=True, db_index=True, max_length=64)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=512)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="activity_events", to="mls.precomproperty")),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="precon_activity_events", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="WebPushSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("endpoint", models.TextField(unique=True)),
                ("p256dh", models.CharField(max_length=255)),
                ("auth", models.CharField(max_length=255)),
                ("user_agent", models.CharField(blank=True, max_length=512)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="web_push_subscriptions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="AIAssistLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_key", models.CharField(blank=True, max_length=64)),
                ("question", models.CharField(max_length=500)),
                ("answer", models.TextField(blank=True)),
                ("links", models.JSONField(blank=True, default=list)),
                ("handoff", models.CharField(default="none", max_length=16)),
                ("fallback", models.BooleanField(default=False)),
                ("error", models.TextField(blank=True)),
                ("model", models.CharField(blank=True, max_length=80)),
                ("prompt_tokens", models.PositiveIntegerField(default=0)),
                ("completion_tokens", models.PositiveIntegerField(default=0)),
                ("latency_ms", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ai_assist_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="preconactivityevent",
            index=models.Index(fields=["project", "event", "created_at"], name="mls_preconact_proj_evt_idx"),
        ),
        migrations.AddIndex(
            model_name="preconactivityevent",
            index=models.Index(fields=["user", "created_at"], name="mls_preconact_user_idx"),
        ),
        migrations.AddIndex(
            model_name="webpushsubscription",
            index=models.Index(fields=["user", "-created_at"], name="mls_webpush_user_idx"),
        ),
    ]
