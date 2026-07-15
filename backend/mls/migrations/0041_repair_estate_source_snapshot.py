from django.db import migrations


def add_missing_snapshot_columns(apps, schema_editor):
    table_name = "mls_estatesourcesnapshot"

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = %s
            """,
            [table_name],
        )

        existing_columns = {row[0] for row in cursor.fetchall()}
        quoted_table = schema_editor.quote_name(table_name)

        if "imported_project_values" not in existing_columns:
            cursor.execute(
                f"""
                ALTER TABLE {quoted_table}
                ADD COLUMN imported_project_values jsonb NOT NULL
                DEFAULT '{{}}'::jsonb
                """
            )


def remove_snapshot_columns(apps, schema_editor):
    quoted_table = schema_editor.quote_name(
        "mls_estatesourcesnapshot"
    )

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"""
            ALTER TABLE {quoted_table}
            DROP COLUMN IF EXISTS imported_project_values
            """
        )


class Migration(migrations.Migration):

    dependencies = [
        # Keep the dependency Django generated here.
    ]

    operations = [
        migrations.RunPython(
            add_missing_snapshot_columns,
            reverse_code=remove_snapshot_columns,
        ),
    ]