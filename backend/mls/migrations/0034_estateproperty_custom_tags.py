from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0033_estateproperty_model_state"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE mls_estateproperty
                        ADD COLUMN IF NOT EXISTS custom_tags TEXT;
                    """,
                    reverse_sql="""
                        ALTER TABLE mls_estateproperty
                        DROP COLUMN IF EXISTS custom_tags;
                    """,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="estateproperty",
                    name="custom_tags",
                    field=models.TextField(blank=True, null=True),
                )
            ],
        )
    ]
