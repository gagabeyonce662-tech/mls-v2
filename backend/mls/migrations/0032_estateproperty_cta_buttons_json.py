from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0031_estateproperty_drop_not_null_constraints"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproperty
                ADD COLUMN IF NOT EXISTS cta_buttons_json JSONB DEFAULT '[]'::jsonb;
            """,
            reverse_sql="""
                ALTER TABLE mls_estateproperty
                DROP COLUMN IF EXISTS cta_buttons_json;
            """,
        ),
    ]
