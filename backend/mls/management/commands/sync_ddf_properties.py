
import time
from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction
from django.db.models import Q
from django.utils import timezone
from mls.helpers import get_access_token
from datetime import timedelta
from mls.models import (
    ListingSyncStatus,
    Media,
    OpenHouse,
    Property,
    Room,
)
from mls.services.map_aggregates import rebuild_h3_aggregates
from mls.snapshot_utils import (
    bulk_record_listing_first_seen,
    bulk_record_property_snapshots,
)
from mls.services.ddf.converters import (
    safe_bool,
    safe_decimal,
    safe_int,
    safe_str,
)
from mls.services.ddf.mapper import map_property_defaults
from mls.services.ddf.client import (
    fetch_all_open_houses,
    fetch_all_properties,
)
from mls.services.ddf.open_house_mapper import (
    map_open_house_defaults,
)

class Command(BaseCommand):
    help = 'Maintain a small, recent DDF listing cache.'

    CACHE_POLICY_KEY = "ddf_cache_v2_initialized"
    # A 24-hour DDF cache is deliberately far below the 300 MB storage budget.
    CACHE_RETENTION_DAYS = 1
    INCREMENTAL_OVERLAP_MINUTES = 10
    # Seed at most 2,500 recently modified listings.  This provides an
    # immediately useful catalogue without approaching the 300 MB budget.
    INITIAL_CACHE_MAX_PAGES = 25
    GTA_CITIES = (
        "Toronto",
        "Mississauga",
        "Brampton",
        "Vaughan",
        "Markham",
        "Richmond Hill",
        "Oakville",
        "Burlington",
        "Milton",
        "Halton Hills",
        "Caledon",
        "King",
        "Aurora",
        "Newmarket",
        "Georgina",
        "East Gwillimbury",
        "Whitchurch-Stouffville",
        "Pickering",
        "Ajax",
        "Whitby",
        "Oshawa",
        "Clarington",
        "Scugog",
        "Uxbridge",
    )

    def add_arguments(self, parser):
        parser.add_argument('--full', action='store_true', help='Unsupported: this cache intentionally never imports the full catalogue.')
        parser.add_argument('--threads', type=int, default=10, help='Deprecated. Kept temporarily for compatibility. Use default threading.'
        "DDF pagination is sequential")
        parser.add_argument('--batch-size', type=int, default=5000, help='Properties per DB batch')
        parser.add_argument(
            '--max-pages',
            type=int,
            default=0,
            help='Optional safety cap for pages during testing. 0 means no cap.',
        )
        parser.add_argument(
            '--retention-days',
            type=int,
            default=self.CACHE_RETENTION_DAYS,
            help='Keep DDF listings modified within this many days (default: 1).',
        )
        parser.add_argument(
            '--insert-new-only',
            action='store_true',
            help='Insert unseen listing keys only; never update existing DDF rows.',
        )
        parser.add_argument(
            '--max-storage-mb',
            type=int,
            default=280,
            help='Maximum total PostgreSQL database size in MB (default: 280).',
        )
        parser.add_argument(
            '--priority-cache',
            action='store_true',
            help='Seed GTA listings first, followed by the rest of Ontario.',
        )
        parser.add_argument(
            '--max-pages-per-tier',
            type=int,
            default=100,
            help='Maximum 100-listing pages to fetch per priority tier (default: 100).',
        )

    def build_incremental_filter(self, force_full=False):
        """
        Build the DDF filter used for an incremental sync.

        An empty cache starts from the overlap window, rather than importing the
        complete catalogue.  This keeps the cache within the storage budget.
        """
        latest_property = Property.objects.filter(
            category_type=Property.DDF
        ).order_by(
            "-modification_timestamp"
        ).first()

        latest_timestamp = (
            latest_property.modification_timestamp
            if latest_property else None
        )
        cutoff = (latest_timestamp or timezone.now()) - timedelta(
            minutes=self.INCREMENTAL_OVERLAP_MINUTES
        )

        return (
            "ModificationTimestamp gt "
            f"{cutoff.isoformat()}"
        )

    def handle(self, *args, **options):
        start_time = time.time()

        if options["full"]:
            raise CommandError(
                "Full DDF imports are disabled because the database is limited "
                "to a small rolling cache."
            )

        retention_days = options["retention_days"]
        if retention_days < 1:
            raise CommandError("--retention-days must be at least 1.")
        max_storage_mb = options["max_storage_mb"]
        if max_storage_mb < 1:
            raise CommandError("--max-storage-mb must be at least 1.")
        if options["max_pages_per_tier"] < 1:
            raise CommandError("--max-pages-per-tier must be at least 1.")

        self.initialize_small_cache()
        if not options["priority_cache"]:
            self.prune_expired_properties(retention_days)
        self.enforce_storage_limit(max_storage_mb)

        cache_is_empty = not Property.objects.filter(
            category_type=Property.DDF
        ).exists()

        token = get_access_token()

        if not token:
            self.stderr.write(
                "Failed to get access token"
            )
            return

        headers = {
            "Authorization": f"Bearer {token}",
        }

        self.stdout.write(
            "Downloading DDF properties..."
        )
        if options["priority_cache"]:
            downloaded_count, page_count = self.sync_priority_cache_in_stages(
                headers=headers,
                max_pages=options["max_pages"] or options["max_pages_per_tier"],
                batch_size=options["batch_size"],
                insert_new_only=options["insert_new_only"],
                max_storage_mb=max_storage_mb,
            )
        else:
            filter_expression = self.build_incremental_filter(
                force_full=options["full"],
            )
            max_pages = options["max_pages"]
            if cache_is_empty:
                max_pages = max_pages or self.INITIAL_CACHE_MAX_PAGES
                filter_expression = None
                self.stdout.write(
                    "DDF cache is empty; seeding up to "
                    f"{max_pages * 100:,} recently modified listings."
                )

            all_properties, page_count = fetch_all_properties(
                headers=headers,
                filter_expression=filter_expression,
                max_pages=max_pages,
                progress_callback=self.stdout.write,
            )
            downloaded_count = len(all_properties)

            self.stdout.write(
                f"Downloaded {page_count} pages containing "
                f"{downloaded_count:,} listings."
            )

            if not all_properties:
                self.stdout.write("No properties returned.")
                return

            self.stdout.write(
                f"Starting bulk upsert of {downloaded_count:,} properties..."
            )

            # The download can run for nearly an hour.  Do not reuse the
            # connection that was opened to determine the incremental filter:
            # managed Postgres providers may close an idle SSL connection.
            connections.close_all()
            self.bulk_upsert(
                all_properties,
                batch_size=options["batch_size"],
                insert_new_only=options["insert_new_only"],
                max_storage_mb=max_storage_mb,
            )


        if not options["priority_cache"]:
            self.prune_expired_properties(retention_days)
        self.enforce_storage_limit(max_storage_mb)

        self.sync_open_houses(headers)

        self.stdout.write("Rebuilding H3 map aggregates...")
        aggregate_cells = rebuild_h3_aggregates()
        self.stdout.write(
            self.style.SUCCESS(f"Built {aggregate_cells:,} aggregate cells")
        )

        ListingSyncStatus.objects.update_or_create(
            key="ddf_properties",
            defaults={
                "last_successful_at": timezone.now(),
                "listing_count": downloaded_count,
            },
        )

        elapsed = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(f"COMPLETED in {elapsed:.1f} seconds ({downloaded_count/elapsed:.1f} props/sec)"))

    def sync_priority_cache_in_stages(
        self,
        headers,
        max_pages,
        batch_size,
        insert_new_only,
        max_storage_mb,
    ):
        """Fetch and commit each priority tier before requesting the next one."""
        downloaded_count = 0
        page_count = 0
        seen_listing_keys = set()

        gta_city_page_limit = max(
            1,
            max_pages // len(self.GTA_CITIES),
        )

        gta_tiers = tuple(
            (
                f"GTA: {city}",
                f"City eq '{city}'",
                gta_city_page_limit,
            )
            for city in self.GTA_CITIES
        )

        tiers = gta_tiers + (
            (
                "remaining Ontario",
                "StateOrProvince eq 'Ontario'",
                max_pages,
            ),
        )

        for tier_name, filter_expression, tier_page_limit in tiers:
            self.stdout.write(
                f"Fetching {tier_name} priority tier (up to "
                f"{tier_page_limit * 100:,} listings)..."
            )

            properties, tier_pages = fetch_all_properties(
                headers=headers,
                filter_expression=filter_expression,
                max_pages=tier_page_limit,
                progress_callback=self.stdout.write,
            )

            page_count += tier_pages
            unique_properties = []

            for property_data in properties:
                listing_key = property_data.get("ListingKey")

                if (
                    listing_key
                    and listing_key not in seen_listing_keys
                ):
                    seen_listing_keys.add(listing_key)
                    unique_properties.append(property_data)

            downloaded_count += len(unique_properties)

            if not unique_properties:
                self.stdout.write(
                    f"{tier_name}: no new listing keys to write."
                )
                continue

            self.stdout.write(
                f"{tier_name}: committing "
                f"{len(unique_properties):,} listings "
                "before continuing..."
            )

            connections.close_all()

            self.bulk_upsert(
                unique_properties,
                batch_size=batch_size,
                insert_new_only=insert_new_only,
                max_storage_mb=max_storage_mb,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"{tier_name}: committed "
                    f"{len(unique_properties):,} listings."
                )
            )

        self.stdout.write(
            f"Downloaded and checkpointed {page_count:,} pages "
            f"containing {downloaded_count:,} unique listings."
        )

        return downloaded_count, page_count


    def sync_open_houses(self, headers):
        self.stdout.write("Downloading DDF open houses...")

        open_house_data, page_count = fetch_all_open_houses(
            headers=headers,
            progress_callback=self.stdout.write,
        )

        self.stdout.write(
            f"Downloaded {page_count:,} OpenHouse pages containing "
            f"{len(open_house_data):,} events."
        )

        cached_properties = (
            Property.objects
            .filter(category_type=Property.DDF)
            .in_bulk(field_name="listing_key")
        )

        open_house_objects = []
        seen_open_house_keys = set()

        skipped_missing_key = 0
        skipped_missing_property = 0

        for data in open_house_data:
            open_house_key = data.get("OpenHouseKey")
            listing_key = data.get("ListingKey")

            if not open_house_key or not listing_key:
                skipped_missing_key += 1
                continue

            property_obj = cached_properties.get(listing_key)

            if property_obj is None:
                skipped_missing_property += 1
                continue

            if open_house_key in seen_open_house_keys:
                continue

            seen_open_house_keys.add(open_house_key)

            open_house_objects.append(
                OpenHouse(
                    property=property_obj,
                    open_house_key=open_house_key,
                    **map_open_house_defaults(data),
                )
            )

        OpenHouse.objects.filter(
            property__category_type=Property.DDF
        ).delete()

        if open_house_objects:
            OpenHouse.objects.bulk_create(
                open_house_objects,
                batch_size=1000,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Stored {len(open_house_objects):,} open houses. "
                f"Skipped {skipped_missing_property:,} events for listings "
                f"outside the local DDF cache and "
                f"{skipped_missing_key:,} malformed events."
            )
        )

    def sync_open_houses(self, headers):
        self.stdout.write("Downloading DDF open houses...")

        open_house_data, page_count = fetch_all_open_houses(
            headers=headers,
            progress_callback=self.stdout.write,
        )

        self.stdout.write(
            f"Downloaded {page_count:,} OpenHouse pages containing "
            f"{len(open_house_data):,} events."
        )

        cached_properties = Property.objects.filter(
            category_type=Property.DDF
        ).in_bulk(
            field_name="listing_key"
        )

        open_house_objects = []
        seen_open_house_keys = set()

        skipped_missing_key = 0
        skipped_missing_property = 0

        for data in open_house_data:
            open_house_key = data.get("OpenHouseKey")
            listing_key = data.get("ListingKey")

            if not open_house_key or not listing_key:
                skipped_missing_key += 1
                continue

            property_obj = cached_properties.get(listing_key)

            if property_obj is None:
                skipped_missing_property += 1
                continue

            if open_house_key in seen_open_house_keys:
                continue

            seen_open_house_keys.add(open_house_key)

            open_house_objects.append(
                OpenHouse(
                    property=property_obj,
                    open_house_key=open_house_key,
                    **map_open_house_defaults(data),
                )
            )

        OpenHouse.objects.filter(
            property__category_type=Property.DDF
        ).delete()

        if open_house_objects:
            OpenHouse.objects.bulk_create(
                open_house_objects,
                batch_size=1000,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Stored {len(open_house_objects):,} open houses. "
                f"Skipped {skipped_missing_property:,} events for listings "
                f"outside the local DDF cache and "
                f"{skipped_missing_key:,} malformed events."
            )
        )

    def sync_open_houses(self, headers):
        self.stdout.write("Downloading DDF open houses...")

        open_house_data, page_count = fetch_all_open_houses(
            headers=headers,
            progress_callback=self.stdout.write,
        )

        self.stdout.write(
            f"Downloaded {page_count:,} OpenHouse pages containing "
            f"{len(open_house_data):,} events."
        )

        cached_properties = Property.objects.filter(
            category_type=Property.DDF
        ).in_bulk(
            field_name="listing_key"
        )

        open_house_objects = []
        seen_open_house_keys = set()

        skipped_missing_key = 0
        skipped_missing_property = 0

        for data in open_house_data:
            open_house_key = data.get("OpenHouseKey")
            listing_key = data.get("ListingKey")

            if not open_house_key or not listing_key:
                skipped_missing_key += 1
                continue

            property_obj = cached_properties.get(listing_key)

            if property_obj is None:
                skipped_missing_property += 1
                continue

            if open_house_key in seen_open_house_keys:
                continue

            seen_open_house_keys.add(open_house_key)

            open_house_objects.append(
                OpenHouse(
                    property=property_obj,
                    open_house_key=open_house_key,
                    **map_open_house_defaults(data),
                )
            )

        OpenHouse.objects.filter(
            property__category_type=Property.DDF
        ).delete()

        if open_house_objects:
            OpenHouse.objects.bulk_create(
                open_house_objects,
                batch_size=1000,
            )

        

        self.stdout.write(
            self.style.SUCCESS(
                f"Stored {len(open_house_objects):,} open houses. "
                f"Skipped {skipped_missing_property:,} events for listings "
                f"outside the local DDF cache and "
                f"{skipped_missing_key:,} malformed events."
            )
        )
    def initialize_small_cache(self):
        """Discard the old full-catalogue cache exactly once.

        The old cache is what exhausted Neon storage.  After it is removed, an
        empty cache starts incrementally, so it will only contain listings seen
        in the recent sync window.  ``VACUUM FULL`` returns the old rows' disk
        space to Postgres instead of merely marking it reusable.
        """
        if ListingSyncStatus.objects.filter(key=self.CACHE_POLICY_KEY).exists():
            return

        ddf_properties = Property.objects.filter(category_type=Property.DDF)
        deleted_count = ddf_properties.count()
        if deleted_count:
            ddf_properties.delete()
            self.stdout.write(
                self.style.WARNING(
                    f"Removed {deleted_count:,} old DDF listings to initialize "
                    "the small rolling cache."
                )
            )
            self.vacuum_ddf_tables()

        ListingSyncStatus.objects.update_or_create(
            key=self.CACHE_POLICY_KEY,
            defaults={
                "last_successful_at": timezone.now(),
                "listing_count": 0,
            },
        )

    def vacuum_ddf_tables(self):
        """Physically reclaim storage after the one-time cache reset."""
        table_names = [
            Property._meta.db_table,
            Room._meta.db_table,
            Media._meta.db_table,
        ]
        connection = connections["default"]
        quoted_tables = ", ".join(
            connection.ops.quote_name(table_name)
            for table_name in table_names
        )
        self.stdout.write("Reclaiming database storage from the old DDF cache...")
        with connection.cursor() as cursor:
            cursor.execute(f"VACUUM (FULL, ANALYZE) {quoted_tables}")

    def database_size_bytes(self):
        """Return the physical size of the current PostgreSQL database."""
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT pg_database_size(current_database())")
            return cursor.fetchone()[0]

    def enforce_storage_limit(self, max_storage_mb):
        """Prune the oldest DDF cache entries until the DB is under its cap.

        PostgreSQL keeps deleted rows' disk pages until vacuumed.  We therefore
        run VACUUM FULL only when the configured cap has actually been crossed;
        it is intentionally not part of ordinary sync runs.
        """
        limit_bytes = max_storage_mb * 1024 * 1024
        current_size = self.database_size_bytes()

        while current_size > limit_bytes:
            ddf_properties = Property.objects.filter(category_type=Property.DDF)
            # Preserve the GTA priority tier for as long as possible.  Only if
            # every remaining DDF record is in the GTA do we prune that tier.
            oldest_ids = list(
                ddf_properties.exclude(city__in=self.GTA_CITIES)
                .order_by("modification_timestamp", "id")
                .values_list("id", flat=True)[:1000]
            )
            if not oldest_ids:
                oldest_ids = list(
                    ddf_properties.order_by("modification_timestamp", "id")
                    .values_list("id", flat=True)[:1000]
                )
            if not oldest_ids:
                raise CommandError(
                    f"Database is {current_size / 1024 / 1024:.1f} MB, above "
                    f"the {max_storage_mb} MB cap, but there are no DDF rows "
                    "left to prune."
                )

            deleted_count, _ = Property.objects.filter(id__in=oldest_ids).delete()
            self.stdout.write(
                f"Storage cap exceeded; deleted {deleted_count:,} old DDF "
                "records and reclaiming disk space."
            )
            self.vacuum_ddf_tables()
            current_size = self.database_size_bytes()

        self.stdout.write(
            f"Database size: {current_size / 1024 / 1024:.1f} MB "
            f"(cap: {max_storage_mb} MB)."
        )

    def prune_expired_properties(self, retention_days):
        """Keep only recent DDF records so the rolling cache stays small."""
        cutoff = timezone.now() - timedelta(days=retention_days)
        expired = Property.objects.filter(category_type=Property.DDF).filter(
            Q(modification_timestamp__lt=cutoff)
            | Q(modification_timestamp__isnull=True)
        )
        expired_count = expired.count()
        if expired_count:
            expired.delete()
            self.stdout.write(
                f"Deleted {expired_count:,} DDF listings older than "
                f"{retention_days} days."
            )

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


    def bulk_upsert(
        self,
        properties_data,
        batch_size=5000,
        insert_new_only=False,
        max_storage_mb=280,
    ):
        # Commit each batch independently.  A single transaction across the
        # whole catalogue creates large temporary storage spikes.
        for i in range(0, len(properties_data), batch_size):
            batch = properties_data[i:i + batch_size]
            self.process_batch(batch, insert_new_only=insert_new_only)
            self.enforce_storage_limit(max_storage_mb)
            self.stdout.write(f"Processed batch {i//batch_size + 1}/{(len(properties_data)-1)//batch_size + 1}")

    @transaction.atomic
    def process_batch(self, batch, insert_new_only=False):
        listing_keys = [p["ListingKey"] for p in batch if p.get("ListingKey")]
        existing = Property.objects.filter(listing_key__in=listing_keys).in_bulk(field_name="listing_key")
        existing_keys = set(existing.keys())

        property_objs = []
        room_objs = []
        media_objs = []
        properties_to_update = []
        first_seen_rows = []
        snapshot_rows = []

        for data in batch:
            key = data.get("ListingKey")
            if not key:
                continue

            defaults = map_property_defaults(data)
           
            first_seen_rows.append(
                (key, defaults.get("modification_timestamp") or defaults.get("original_entry_timestamp"))
            )

            if key in existing:
                if insert_new_only:
                    continue

                prop = existing[key]

                old_price = prop.list_price
                old_status = (prop.standard_status or "").strip()
                old_modification_timestamp = prop.modification_timestamp

                new_price = defaults.get("list_price")
                new_status = (defaults.get("standard_status") or "").strip()
                new_modification_timestamp = defaults.get("modification_timestamp")

                snapshot_changed = (
                    old_price != new_price
                    or old_status != new_status
                    or old_modification_timestamp != new_modification_timestamp
                )

                for field, value in defaults.items():
                    setattr(prop, field, value)

                properties_to_update.append(prop)

                if snapshot_changed:
                    snapshot_rows.append(
                        (
                            key,
                            new_price,
                            new_status,
                            new_modification_timestamp,
                        )
                    )

            else:
                prop = Property(listing_key=key, **defaults)
                property_objs.append(prop)

                snapshot_rows.append(
                    (
                        key,
                        defaults.get("list_price"),
                        defaults.get("standard_status") or "",
                        defaults.get("modification_timestamp"),
                    )
                )

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

        if snapshot_rows:
            bulk_record_property_snapshots(snapshot_rows)


# Incremental sync
# python manage.py sync_ddf_properties --batch-size 8000

# Full sync
# python manage.py sync_ddf_properties --full --batch-size 8000
