from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0035_estateproperty_detail_blocks"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE mls_estateproperty
                        ADD COLUMN IF NOT EXISTS listing_buttons_json JSONB DEFAULT '[]'::jsonb;
                    """,
                    reverse_sql="""
                        ALTER TABLE mls_estateproperty
                        DROP COLUMN IF EXISTS listing_buttons_json;
                    """,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="estateproperty",
                    name="listing_buttons_json",
                    field=models.JSONField(blank=True, default=list),
                ),
            ],
        )
    ]
