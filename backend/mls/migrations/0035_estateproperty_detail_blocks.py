from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0034_estateproperty_custom_tags"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE mls_estateproperty
                        ADD COLUMN IF NOT EXISTS custom_detail_blocks_json JSONB DEFAULT '[]'::jsonb,
                        ADD COLUMN IF NOT EXISTS detail_blocks_layout_json JSONB DEFAULT '[]'::jsonb;
                    """,
                    reverse_sql="""
                        ALTER TABLE mls_estateproperty
                        DROP COLUMN IF EXISTS custom_detail_blocks_json,
                        DROP COLUMN IF EXISTS detail_blocks_layout_json;
                    """,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="estateproperty",
                    name="custom_detail_blocks_json",
                    field=models.JSONField(blank=True, default=list),
                ),
                migrations.AddField(
                    model_name="estateproperty",
                    name="detail_blocks_layout_json",
                    field=models.JSONField(blank=True, default=list),
                ),
            ],
        )
    ]
