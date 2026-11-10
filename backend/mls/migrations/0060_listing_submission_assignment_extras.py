from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mls", "0059_activity_assist_push"),
    ]

    operations = [
        migrations.AddField(
            model_name="listingsubmission",
            name="agreement_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="ownership_title",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="storeys",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="floors",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="parking",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="locker",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="maintenance_fees",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="listingsubmission",
            name="consent_to_advertise",
            field=models.BooleanField(default=False),
        ),
    ]
