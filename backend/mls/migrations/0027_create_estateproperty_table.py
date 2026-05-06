from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0026_rename_mls_agentser_kind_3e4f5a_idx_mls_agentse_kind_a14dba_idx_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS mls_estateproperty
                (LIKE mls_property INCLUDING ALL);
            """,
            reverse_sql="""
                DROP TABLE IF EXISTS mls_estateproperty;
            """,
        ),
    ]
