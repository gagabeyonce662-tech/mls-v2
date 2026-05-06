from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0030_estateproperty_pricing_and_specs_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                DO $$
                DECLARE
                    col RECORD;
                BEGIN
                    FOR col IN
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'mls_estateproperty'
                          AND is_nullable = 'NO'
                          AND column_name <> 'id'
                    LOOP
                        EXECUTE format(
                            'ALTER TABLE mls_estateproperty ALTER COLUMN %I DROP NOT NULL',
                            col.column_name
                        );
                    END LOOP;
                END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
