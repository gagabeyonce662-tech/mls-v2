"""
Backfill / refresh PropertySoldProxy from PropertySnapshot transitions (Active -> non-Active).
Idempotent: update_or_create by listing_key.
"""
from django.core.management.base import BaseCommand
from django.db.models import Count

from mls.models import Property, PropertySnapshot, PropertySoldProxy


def _is_active(status: str) -> bool:
    s = (status or "").strip().lower()
    return s == "active"


def _fsa_from_postal(postal: str) -> str:
    if not postal:
        return ""
    s = "".join(c for c in str(postal).upper() if c.isalnum())
    return s[:3] if len(s) >= 3 else ""


class Command(BaseCommand):
    help = "Populate PropertySoldProxy rows from PropertySnapshot Active->non-Active transitions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Max distinct listing_keys to process (0 = all)",
        )

    def handle(self, *args, **options):
        limit = int(options.get("limit") or 0)

        keys_qs = (
            PropertySnapshot.objects.values("listing_key")
            .annotate(n=Count("id"))
            .filter(n__gte=2)
            .values_list("listing_key", flat=True)
            .order_by("listing_key")
        )
        if limit > 0:
            keys_qs = keys_qs[:limit]

        keys = list(keys_qs)
        created = 0
        updated = 0

        for listing_key in keys:
            snaps = list(
                PropertySnapshot.objects.filter(listing_key=listing_key).order_by("created_at", "id")
            )
            if len(snaps) < 2:
                continue

            last_transition = None
            for i in range(1, len(snaps)):
                prev, curr = snaps[i - 1], snaps[i]
                if _is_active(prev.standard_status) and not _is_active(curr.standard_status):
                    price = prev.list_price or curr.list_price
                    ts = curr.created_at
                    last_transition = (ts, price)

            if not last_transition:
                continue

            sold_at_proxy, last_price = last_transition
            prop = Property.objects.filter(listing_key=listing_key).first()

            fsa = _fsa_from_postal(prop.postal_code) if prop and prop.postal_code else ""

            defaults = {
                "last_list_price": last_price,
                "sold_at_proxy": sold_at_proxy,
                "fsa": fsa,
                "latitude": prop.latitude if prop else None,
                "longitude": prop.longitude if prop else None,
                "bedrooms_total": prop.bedrooms_total if prop else None,
                "bathrooms_total_integer": prop.bathrooms_total_integer if prop else None,
                "bathrooms_partial": prop.bathrooms_partial if prop else None,
                "bedrooms_below_grade": prop.bedrooms_below_grade if prop else None,
                "living_area": prop.living_area if prop else None,
                "property_sub_type": prop.property_sub_type if prop else None,
                "lot_size_area": prop.lot_size_area if prop else None,
                "frontage_length_numeric": prop.frontage_length_numeric if prop else None,
                "parking_total": prop.parking_total if prop else None,
                "tax_annual_amount": prop.tax_annual_amount if prop else None,
                "city": prop.city if prop else None,
                "city_region": prop.city_region if prop else None,
                "unparsed_address": prop.unparsed_address if prop else None,
            }

            obj, was_created = PropertySoldProxy.objects.update_or_create(
                listing_key=listing_key,
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"capture_sold_proxy done: keys={len(keys)}, created={created}, updated={updated}"
            )
        )
