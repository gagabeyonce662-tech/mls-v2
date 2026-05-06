from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0028_estateproperty_wp_metadata_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproperty
                ADD COLUMN IF NOT EXISTS property_title TEXT,
                ADD COLUMN IF NOT EXISTS property_slug VARCHAR(255),
                ADD COLUMN IF NOT EXISTS publish_status VARCHAR(32) DEFAULT 'draft',
                ADD COLUMN IF NOT EXISTS property_description TEXT,
                ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
                ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

                CREATE INDEX IF NOT EXISTS mls_estateproperty_property_slug_idx
                ON mls_estateproperty (property_slug);

                CREATE INDEX IF NOT EXISTS mls_estateproperty_publish_status_idx
                ON mls_estateproperty (publish_status);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS mls_estateproperty_property_slug_idx;
                DROP INDEX IF EXISTS mls_estateproperty_publish_status_idx;

                ALTER TABLE mls_estateproperty
                DROP COLUMN IF EXISTS property_title,
                DROP COLUMN IF EXISTS property_slug,
                DROP COLUMN IF EXISTS publish_status,
                DROP COLUMN IF EXISTS property_description,
                DROP COLUMN IF EXISTS featured_image_url,
                DROP COLUMN IF EXISTS expires_at;
            """,
        ),
    ]
