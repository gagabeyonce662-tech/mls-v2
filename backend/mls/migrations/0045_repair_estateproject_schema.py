from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0044_alter_estateproperty_options"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproject
                DROP COLUMN IF EXISTS summary;

                ALTER TABLE mls_estateproject
                ALTER COLUMN province TYPE varchar(255)
                USING province::varchar(255);
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]