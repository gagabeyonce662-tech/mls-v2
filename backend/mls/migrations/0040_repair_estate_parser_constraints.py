from django.db import migrations


INDEXES = {
    "uniq_estate_section_source": (
        "mls_estatecontentsection",
        "project_id",
    ),
    "uniq_estate_unit_source": (
        "mls_estateunittype",
        "project_id",
    ),
    "uniq_estate_price_source": (
        "mls_estateprice",
        "project_id",
    ),
    "uniq_estate_deposit_source": (
        "mls_estatedepositplan",
        "project_id",
    ),
    "uniq_estate_installment_source": (
        "mls_estatedepositinstallment",
        "plan_id",
    ),
    "uniq_estate_incentive_source": (
        "mls_estateincentive",
        "project_id",
    ),
    "uniq_estate_amenity_source": (
        "mls_estateamenity",
        "project_id",
    ),
    "uniq_estate_document_source": (
        "mls_estatedocument",
        "project_id",
    ),
}


def add_missing_parser_constraints(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        for index_name, (table_name, parent_column) in INDEXES.items():
            quoted_index = schema_editor.quote_name(index_name)
            quoted_table = schema_editor.quote_name(table_name)
            quoted_parent = schema_editor.quote_name(parent_column)
            quoted_source_key = schema_editor.quote_name("source_key")

            cursor.execute(
                f"""
                CREATE UNIQUE INDEX IF NOT EXISTS {quoted_index}
                ON {quoted_table} ({quoted_parent}, {quoted_source_key})
                WHERE {quoted_source_key} <> ''
                """
            )


def remove_parser_constraints(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        for index_name in INDEXES:
            quoted_index = schema_editor.quote_name(index_name)
            cursor.execute(f"DROP INDEX IF EXISTS {quoted_index}")


class Migration(migrations.Migration):

    dependencies = [
        # Keep the dependency Django generated here.
        # Example:
        ("mls", "0039_repair_estate_parser_columns"),
    ]

    operations = [
        migrations.RunPython(
            add_missing_parser_constraints,
            reverse_code=remove_parser_constraints,
        ),
    ]