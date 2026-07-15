
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from mls.helpers import get_access_token
from datetime import timedelta
from mls.models import Property, Room, Media  # Replace with your actual app name
from mls.services.map_aggregates import rebuild_h3_aggregates
from mls.snapshot_utils import bulk_record_listing_first_seen
from mls.services.ddf.converters import (
    safe_bool,
    safe_decimal,
    safe_int,
    safe_str,
)
from mls.services.ddf.mapper import map_property_defaults
from mls.services.ddf.client import fetch_all_properties


class Command(BaseCommand):
    help = 'Ultra-fast full sync of REALTOR.ca DDF properties'

    def add_arguments(self, parser):
        parser.add_argument('--full', action='store_true', help='Force full sync (ignore incremental)')
        parser.add_argument('--threads', type=int, default=10, help='Deprecated. Kept temporarily for compatibility. Use default threading.'
        "DDF pagination is sequential")
        parser.add_argument('--batch-size', type=int, default=5000, help='Properties per DB batch')
        parser.add_argument(
            '--max-pages',
            type=int,
            default=0,
            help='Optional safety cap for pages during testing. 0 means no cap.',
        )

    def build_incremental_filter(self, force_full=False):
        """
        Build the DDF filter used for an incremental sync.

        A full sync returns None, meaning no timestamp filter.
        """
        if force_full:
            return None

        latest_property = Property.objects.order_by(
            "-modification_timestamp"
        ).first()

        if not latest_property:
            return None

        if not latest_property.modification_timestamp:
            return None

        cutoff = (
            latest_property.modification_timestamp
            - timedelta(minutes=10)
        )

        # return (
        #     "ModificationTimestamp gt "
        #     f"{cutoff.isoformat()}Z"
        # )

    def handle(self, *args, **options):
        start_time = time.time()

        token = get_access_token()

        if not token:
            self.stderr.write(
                "Failed to get access token"
            )
            return

        headers = {
            "Authorization": f"Bearer {token}",
        }

        filter_expression = self.build_incremental_filter(
            force_full=options["full"],
        )

        self.stdout.write(
            "Downloading DDF properties..."
        )

        all_properties, page_count = fetch_all_properties(
            headers=headers,
            filter_expression=filter_expression,
            max_pages=options["max_pages"],
        )

        self.stdout.write(
            f"Downloaded {page_count} pages containing "
            f"{len(all_properties):,} listings."
        )

        if not all_properties:
            self.stdout.write(
                "No properties returned."
            )
            return

        processed_keys = {
            property_data.get("ListingKey")
            for property_data in all_properties
            if property_data.get("ListingKey")
        }

        self.stdout.write(
            f"Starting bulk upsert of "
            f"{len(all_properties):,} properties..."
        )

        self.bulk_upsert(
            all_properties,
            batch_size=options["batch_size"],
        )


        if options["full"]:
            self.stdout.write(
                "Full sync completed; checking for orphaned properties..."
            )
            self.cleanup_orphaned_properties(processed_keys)
        else:
            self.stdout.write(
                "Incremental sync: skipping orphan cleanup."
            )

        self.stdout.write("Rebuilding H3 map aggregates...")
        aggregate_cells = rebuild_h3_aggregates()
        self.stdout.write(
            self.style.SUCCESS(f"Built {aggregate_cells:,} aggregate cells")
        )

        elapsed = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(f"COMPLETED in {elapsed:.1f} seconds ({len(all_properties)/elapsed:.1f} props/sec)"))

    def cleanup_orphaned_properties(self, processed_keys):
        """Deletes properties tagged as DDF that were NOT seen in this sync."""
        if not processed_keys:
            return

        # Safety Check: Don't delete if we processed suspiciously few properties
        current_ddf_count = Property.objects.filter(category_type=Property.DDF).count()
        if len(processed_keys) < (current_ddf_count * 0.5) and current_ddf_count > 100:
            self.stdout.write(self.style.ERROR(
                f"ABORTING CLEANUP: Processed {len(processed_keys)} listings, which is < 50% of "
                f"current database count ({current_ddf_count}). This might indicate an API failure."
            ))
            return

        self.stdout.write(f"Cleaning up orphaned MLS properties...")
        orphans = Property.objects.filter(category_type=Property.DDF).exclude(listing_key__in=processed_keys)
        orphan_count = orphans.count()
        
        if orphan_count > 0:
            # Delete related rooms and media first (though Django usually handles CASCADE)
            # Property.objects.filter(...) delete() handles cascade automatically if models are set up correctly.
            orphans.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {orphan_count} orphaned MLS listings."))
        else:
            self.stdout.write("No orphaned listings found.")


    @transaction.atomic
    def bulk_upsert(self, properties_data, batch_size=5000):
        # We'll process in batches to avoid memory explosion
        for i in range(0, len(properties_data), batch_size):
            batch = properties_data[i:i + batch_size]
            self.process_batch(batch)
            self.stdout.write(f"Processed batch {i//batch_size + 1}/{(len(properties_data)-1)//batch_size + 1}")

    def process_batch(self, batch):
        listing_keys = [p["ListingKey"] for p in batch if p.get("ListingKey")]
        existing = Property.objects.filter(listing_key__in=listing_keys).in_bulk(field_name="listing_key")
        existing_keys = set(existing.keys())

        property_objs = []
        room_objs = []
        media_objs = []
        properties_to_update = []
        first_seen_rows = []

        for data in batch:
            key = data.get("ListingKey")
            print(key)
            if not key:
                continue

            defaults = map_property_defaults(data)
           
            first_seen_rows.append(
                (key, defaults.get("modification_timestamp") or defaults.get("original_entry_timestamp"))
            )

            if key in existing:
                prop = existing[key]
                for field, value in defaults.items():
                    setattr(prop, field, value)
                properties_to_update.append(prop)
            else:
                prop = Property(listing_key=key, **defaults)
                property_objs.append(prop)

            # === Rooms ===
            for r in data.get("Rooms", []):
                room_objs.append(Room(
                    property=prop,
                    room_type=safe_str(r.get("RoomType")),
                    room_length=safe_decimal(r.get("RoomLength")),
                    room_width=safe_decimal(r.get("RoomWidth")),
                    room_level=safe_str(r.get("RoomLevel")),
                    room_description=safe_str(r.get("RoomDescription")),
                    room_dimensions=safe_str(r.get("RoomDimensions")),
                    room_length_width_units=safe_str(r.get("RoomLengthWidthUnits")),
                ))

            # === Media ===
            for m in data.get("Media", []):
                media_objs.append(Media(
                    property=prop,
                    media_url=safe_str(m.get("MediaURL")),
                    media_category=safe_str(m.get("MediaCategory")),
                    is_preferred=safe_bool(m.get("PreferredPhotoYN")),
                    order=safe_int(m.get("Order"), 999),
                ))

        # === Final DB Operations ===
        if property_objs:
            Property.objects.bulk_create(property_objs, ignore_conflicts=False)

        if properties_to_update:
            Property.objects.bulk_update(
                properties_to_update,
                fields=[f.name for f in Property._meta.fields if f.name != "id" and f.name != "listing_key"]
            )

        # Replace rooms & media (faster than upsert)
        if property_objs or properties_to_update:
            affected_prop_ids = [p.id for p in (property_objs + properties_to_update) if hasattr(p, 'id')]
            if affected_prop_ids:
                Room.objects.filter(property_id__in=affected_prop_ids).delete()
                Media.objects.filter(property_id__in=affected_prop_ids).delete()

                if room_objs:
                    Room.objects.bulk_create(room_objs, ignore_conflicts=True)
                if media_objs:
                    Media.objects.bulk_create(media_objs, ignore_conflicts=True)

        if first_seen_rows:
            bulk_record_listing_first_seen(first_seen_rows)


# Incremental sync
# python manage.py sync_ddf_properties --batch-size 8000

# Full sync
# python manage.py sync_ddf_properties --full --batch-size 8000