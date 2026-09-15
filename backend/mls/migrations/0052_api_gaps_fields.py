"""Adds fields for the mls-v3 frontend API gap list.

* Property.close_price / close_date (G3, G10)
* Property.previous_list_price / price_change_timestamp (G7)
* PropertyInquiry.listing_key (G8)
* PreComProperty.developer_name / sales_stage (G9)
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0051_openhouse"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="close_price",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=15, null=True
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="close_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="property",
            name="previous_list_price",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=15, null=True
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="price_change_timestamp",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="propertyinquiry",
            name="listing_key",
            field=models.CharField(blank=True, db_index=True, max_length=2000),
        ),
        migrations.AddField(
            model_name="precomproperty",
            name="developer_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="precomproperty",
            name="sales_stage",
            field=models.CharField(
                blank=True,
                choices=[
                    ("coming_soon", "Coming Soon"),
                    ("vip_release", "VIP Release"),
                    ("now_selling", "Now Selling"),
                    ("sold_out", "Sold Out"),
                ],
                max_length=32,
            ),
        ),
    ]
