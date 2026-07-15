from django.db import migrations


TABLES = [
    "mls_estatecontentsection",
    "mls_estateunittype",
    "mls_estateprice",
    "mls_estatedepositplan",
    "mls_estatedepositinstallment",
    "mls_estateincentive",
    "mls_estateamenity",
    "mls_estatedocument",
]


def add_missing_parser_columns(apps, schema_editor):
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = %s
                """,
                [table],
            )
            existing_columns = {row[0] for row in cursor.fetchall()}

            quoted_table = schema_editor.quote_name(table)

            if "source_key" not in existing_columns:
                cursor.execute(
                    f"""
                    ALTER TABLE {quoted_table}
                    ADD COLUMN source_key varchar(255) NOT NULL DEFAULT ''
                    """
                )

            if "parser_owned" not in existing_columns:
                cursor.execute(
                    f"""
                    ALTER TABLE {quoted_table}
                    ADD COLUMN parser_owned boolean NOT NULL DEFAULT false
                    """
                )


def remove_parser_columns(apps, schema_editor):
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        for table in TABLES:
            quoted_table = schema_editor.quote_name(table)
            cursor.execute(
                f"""
                ALTER TABLE {quoted_table}
                DROP COLUMN IF EXISTS parser_owned,
                DROP COLUMN IF EXISTS source_key
                """
            )


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0038_create_estate_project"),
    ]

    operations = [
        migrations.RunPython(
            add_missing_parser_columns,
            reverse_code=remove_parser_columns,
        ),
    ]