from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0031_estateproperty_drop_not_null_constraints"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproperty
                ADD COLUMN IF NOT EXISTS description_sections_json JSONB DEFAULT '[]'::jsonb;

                UPDATE mls_estateproperty
                SET description_sections_json = jsonb_build_array(
                    jsonb_build_object(
                        'id', 'legacy-overview',
                        'title', 'Overview',
                        'body_html', property_description,
                        'order', 0
                    )
                )
                WHERE COALESCE(BTRIM(property_description), '') <> ''
                  AND (
                    description_sections_json IS NULL
                    OR description_sections_json = '[]'::jsonb
                  );
            """,
            reverse_sql="""
                ALTER TABLE mls_estateproperty
                DROP COLUMN IF EXISTS description_sections_json;
            """,
        ),
    ]
