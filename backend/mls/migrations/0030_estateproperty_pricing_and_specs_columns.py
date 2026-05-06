from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0029_estateproperty_editor_workflow_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE mls_estateproperty
                ADD COLUMN IF NOT EXISTS second_price NUMERIC(14,2),
                ADD COLUMN IF NOT EXISTS enable_price_placeholder BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS price_placeholder VARCHAR(255),
                ADD COLUMN IF NOT EXISTS price_prefix VARCHAR(255),
                ADD COLUMN IF NOT EXISTS after_price VARCHAR(255),
                ADD COLUMN IF NOT EXISTS size_postfix VARCHAR(64),
                ADD COLUMN IF NOT EXISTS land_area NUMERIC(14,2),
                ADD COLUMN IF NOT EXISTS land_area_size_postfix VARCHAR(64),
                ADD COLUMN IF NOT EXISTS rooms INTEGER,
                ADD COLUMN IF NOT EXISTS garages INTEGER,
                ADD COLUMN IF NOT EXISTS garage_size VARCHAR(128),
                ADD COLUMN IF NOT EXISTS property_id_code VARCHAR(128),
                ADD COLUMN IF NOT EXISTS max_bedrooms INTEGER,
                ADD COLUMN IF NOT EXISTS developer TEXT,
                ADD COLUMN IF NOT EXISTS occupancy_year INTEGER,
                ADD COLUMN IF NOT EXISTS signing_amount NUMERIC(14,2),
                ADD COLUMN IF NOT EXISTS lot_size VARCHAR(128),
                ADD COLUMN IF NOT EXISTS kitchens INTEGER;
            """,
            reverse_sql="""
                ALTER TABLE mls_estateproperty
                DROP COLUMN IF EXISTS second_price,
                DROP COLUMN IF EXISTS enable_price_placeholder,
                DROP COLUMN IF EXISTS price_placeholder,
                DROP COLUMN IF EXISTS price_prefix,
                DROP COLUMN IF EXISTS after_price,
                DROP COLUMN IF EXISTS size_postfix,
                DROP COLUMN IF EXISTS land_area,
                DROP COLUMN IF EXISTS land_area_size_postfix,
                DROP COLUMN IF EXISTS rooms,
                DROP COLUMN IF EXISTS garages,
                DROP COLUMN IF EXISTS garage_size,
                DROP COLUMN IF EXISTS property_id_code,
                DROP COLUMN IF EXISTS max_bedrooms,
                DROP COLUMN IF EXISTS developer,
                DROP COLUMN IF EXISTS occupancy_year,
                DROP COLUMN IF EXISTS signing_amount,
                DROP COLUMN IF EXISTS lot_size,
                DROP COLUMN IF EXISTS kitchens;
            """,
        ),
    ]
