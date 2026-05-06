from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0027_create_estateproperty_table"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproperty
                ADD COLUMN IF NOT EXISTS wp_meta_json JSONB DEFAULT '{}'::jsonb,
                ADD COLUMN IF NOT EXISTS wp_terms_json JSONB DEFAULT '{}'::jsonb,
                ADD COLUMN IF NOT EXISTS wp_post_json JSONB DEFAULT '{}'::jsonb;
            """,
            reverse_sql="""
                ALTER TABLE mls_estateproperty
                DROP COLUMN IF EXISTS wp_meta_json,
                DROP COLUMN IF EXISTS wp_terms_json,
                DROP COLUMN IF EXISTS wp_post_json;
            """,
        ),
    ]
