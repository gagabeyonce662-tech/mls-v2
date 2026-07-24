import time
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction
from django.db.models import Q
from django.utils import timezone

from mls.helpers import get_access_token
from mls.models import (
    ListingSyncStatus,
    Media,
    Property,
    Room,
)
from mls.services.ddf.client import fetch_all_properties
from mls.services.ddf.converters import (
    safe_bool,
    safe_decimal,
    safe_int,
    safe_str,
)
from mls.services.ddf.mapper import map_property_defaults
from mls.services.map_aggregates import rebuild_h3_aggregates
from mls.snapshot_utils import (
    bulk_record_listing_first_seen,
    bulk_record_property_snapshots,
)


class Command(BaseCommand):
    help = "Maintain a small, recent DDF listing cache."

    CACHE_POLICY_KEY = "ddf_cache_v2_initialized"

    # A 24-hour DDF cache is deliberately far below the database
    # storage budget.
    CACHE_RETENTION_DAYS = 1

    INCREMENTAL_OVERLAP_MINUTES = 10

    # Seed at most 2,500 recently modified listings when the cache
    # starts empty.
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
        parser.add_argument(
            "--full",
            action="store_true",
            help=(
                "Unsupported: this cache intentionally never imports "
                "the full catalogue."
            ),
        )

        parser.add_argument(
            "--threads",
            type=int,
            default=10,
            help=(
                "Deprecated. Kept temporarily for compatibility. "
                "DDF pagination is sequential."
            ),
        )

        parser.add_argument(
            "--batch-size",
            type=int,
            default=5000,
            help="Properties per DB batch.",
        )

        parser.add_argument(
            "--max-pages",
            type=int,
            default=0,
            help=(
                "Optional safety cap for pages during testing. "
                "0 means no cap."
            ),
        )

        parser.add_argument(
            "--retention-days",
            type=int,
            default=self.CACHE_RETENTION_DAYS,
            help=(
                "Keep DDF listings modified within this many days "
                "(default: 1)."
            ),
        )

        parser.add_argument(
            "--insert-new-only",
            action="store_true",
            help=(
                "Insert unseen listing keys only; never update "
                "existing DDF rows."
            ),
        )

        parser.add_argument(
            "--max-storage-mb",
            type=int,
            default=280,
            help=(
                "Maximum total PostgreSQL database size in MB "
                "(default: 280)."
            ),
        )

        parser.add_argument(
            "--priority-cache",
            action="store_true",
            help=(
                "Seed GTA listings first, followed by the rest "
                "of Ontario."
            ),
        )

        parser.add_argument(
            "--max-pages-per-tier",
            type=int,
            default=100,
            help=(
                "Maximum 100-listing pages to fetch per priority "
                "tier (default: 100)."
            ),
        )

    def build_incremental_filter(self):
        """
        Build the DDF filter used for an incremental sync.

        The overlap window helps avoid missing records modified close
        to the boundary between two sync runs.
        """
        latest_property = (
            Property.objects
            .filter(category_type=Property.DDF)
            .order_by("-modification_timestamp")
            .first()
        )

        latest_timestamp = (
            latest_property.modification_timestamp
            if latest_property
            else None
        )

        cutoff = (
            latest_timestamp or timezone.now()
        ) - timedelta(
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
                "Full DDF imports are disabled because the database "
                "is limited to a small rolling cache."
            )

        retention_days = options["retention_days"]

        if retention_days < 1:
            raise CommandError(
                "--retention-days must be at least 1."
            )

        max_storage_mb = options["max_storage_mb"]

        if max_storage_mb < 1:
            raise CommandError(
                "--max-storage-mb must be at least 1."
            )

        if options["max_pages_per_tier"] < 1:
            raise CommandError(
                "--max-pages-per-tier must be at least 1."
            )

        self.initialize_small_cache()

        if not options["priority_cache"]:
            self.prune_expired_properties(
                retention_days
            )

        self.enforce_storage_limit(
            max_storage_mb
        )

        cache_is_empty = not Property.objects.filter(
            category_type=Property.DDF
        ).exists()

        token = get_access_token()

        if not token:
            self.stderr.write(
                self.style.ERROR(
                    "Failed to get access token."
                )
            )
            return

        headers = {
            "Authorization": f"Bearer {token}",
        }

        self.stdout.write(
            "Downloading DDF properties..."
        )

        if options["priority_cache"]:
            downloaded_count, page_count = (
                self.sync_priority_cache_in_stages(
                    headers=headers,
                    max_pages=(
                        options["max_pages"]
                        or options["max_pages_per_tier"]
                    ),
                    batch_size=options["batch_size"],
                    insert_new_only=options[
                        "insert_new_only"
                    ],
                    max_storage_mb=max_storage_mb,
                )
            )

        else:
            filter_expression = (
                self.build_incremental_filter()
            )

            max_pages = options["max_pages"]

            if cache_is_empty:
                max_pages = (
                    max_pages
                    or self.INITIAL_CACHE_MAX_PAGES
                )

                filter_expression = None

                self.stdout.write(
                    "DDF cache is empty; seeding up to "
                    f"{max_pages * 100:,} recently "
                    "modified listings."
                )

            all_properties, page_count = (
                fetch_all_properties(
                    headers=headers,
                    filter_expression=filter_expression,
                    max_pages=max_pages,
                    progress_callback=self.stdout.write,
                )
            )

            downloaded_count = len(
                all_properties
            )

            self.stdout.write(
                f"Downloaded {page_count:,} pages "
                f"containing "
                f"{downloaded_count:,} listings."
            )

            if not all_properties:
                self.stdout.write(
                    "No properties returned."
                )
                return

            self.stdout.write(
                "Starting bulk upsert of "
                f"{downloaded_count:,} properties..."
            )

            # A DDF download can run for a long time.
            # Do not reuse an old idle DB connection.
            connections.close_all()

            self.bulk_upsert(
                all_properties,
                batch_size=options["batch_size"],
                insert_new_only=options[
                    "insert_new_only"
                ],
                max_storage_mb=max_storage_mb,
            )

        if not options["priority_cache"]:
            self.prune_expired_properties(
                retention_days
            )

        self.enforce_storage_limit(
            max_storage_mb
        )

        self.stdout.write(
            "Rebuilding H3 map aggregates..."
        )

        aggregate_cells = (
            rebuild_h3_aggregates()
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Built {aggregate_cells:,} "
                "aggregate cells."
            )
        )

        ListingSyncStatus.objects.update_or_create(
            key="ddf_properties",
            defaults={
                "last_successful_at": (
                    timezone.now()
                ),
                "listing_count": (
                    downloaded_count
                ),
            },
        )

        elapsed = time.time() - start_time

        rate = (
            downloaded_count / elapsed
            if elapsed > 0
            else 0
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"COMPLETED in {elapsed:.1f} "
                f"seconds ({rate:.1f} props/sec)"
            )
        )

    def sync_priority_cache_in_stages(
        self,
        headers,
        max_pages,
        batch_size,
        insert_new_only,
        max_storage_mb,
    ):
        """
        Fetch and commit each priority tier before requesting
        the next one.

        This ensures listings from completed tiers remain saved
        if a later DDF request fails or the command is interrupted.
        """
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

        for (
            tier_name,
            filter_expression,
            tier_page_limit,
        ) in tiers:

            self.stdout.write(
                f"Fetching {tier_name} priority "
                f"tier (up to "
                f"{tier_page_limit * 100:,} "
                "listings)..."
            )

            properties, tier_pages = (
                fetch_all_properties(
                    headers=headers,
                    filter_expression=(
                        filter_expression
                    ),
                    max_pages=tier_page_limit,
                    progress_callback=(
                        self.stdout.write
                    ),
                )
            )

            page_count += tier_pages

            unique_properties = []

            for property_data in properties:
                listing_key = (
                    property_data.get(
                        "ListingKey"
                    )
                )

                if (
                    listing_key
                    and listing_key
                    not in seen_listing_keys
                ):
                    seen_listing_keys.add(
                        listing_key
                    )
                    unique_properties.append(
                        property_data
                    )

            downloaded_count += len(
                unique_properties
            )

            if not unique_properties:
                self.stdout.write(
                    f"{tier_name}: no new "
                    "listing keys to write."
                )
                continue

            self.stdout.write(
                f"{tier_name}: committing "
                f"{len(unique_properties):,} "
                "listings before continuing..."
            )

            connections.close_all()

            self.bulk_upsert(
                unique_properties,
                batch_size=batch_size,
                insert_new_only=(
                    insert_new_only
                ),
                max_storage_mb=(
                    max_storage_mb
                ),
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"{tier_name}: committed "
                    f"{len(unique_properties):,} "
                    "listings."
                )
            )

        self.stdout.write(
            "Downloaded and checkpointed "
            f"{page_count:,} pages containing "
            f"{downloaded_count:,} unique "
            "listings."
        )

        return (
            downloaded_count,
            page_count,
        )

    def initialize_small_cache(self):
        """
        Discard the old full-catalogue cache exactly once.

        After the initial reset, only the small rolling DDF cache
        is maintained.
        """
        if ListingSyncStatus.objects.filter(
            key=self.CACHE_POLICY_KEY
        ).exists():
            return

        ddf_properties = (
            Property.objects.filter(
                category_type=Property.DDF
            )
        )

        deleted_count = (
            ddf_properties.count()
        )

        if deleted_count:
            ddf_properties.delete()

            self.stdout.write(
                self.style.WARNING(
                    f"Removed {deleted_count:,} "
                    "old DDF listings to initialize "
                    "the small rolling cache."
                )
            )

            self.vacuum_ddf_tables()

        ListingSyncStatus.objects.update_or_create(
            key=self.CACHE_POLICY_KEY,
            defaults={
                "last_successful_at": (
                    timezone.now()
                ),
                "listing_count": 0,
            },
        )

    def vacuum_ddf_tables(self):
        """
        Physically reclaim PostgreSQL storage after a large
        DDF deletion.
        """
        table_names = [
            Property._meta.db_table,
            Room._meta.db_table,
            Media._meta.db_table,
        ]

        connection = connections[
            "default"
        ]

        quoted_tables = ", ".join(
            connection.ops.quote_name(
                table_name
            )
            for table_name in table_names
        )

        self.stdout.write(
            "Reclaiming database storage "
            "from the old DDF cache..."
        )

        with connection.cursor() as cursor:
            cursor.execute(
                "VACUUM (FULL, ANALYZE) "
                f"{quoted_tables}"
            )

    def database_size_bytes(self):
        """
        Return the physical size of the current PostgreSQL
        database.
        """
        with connections[
            "default"
        ].cursor() as cursor:
            cursor.execute(
                "SELECT "
                "pg_database_size("
                "current_database()"
                ")"
            )

            return cursor.fetchone()[0]

    def enforce_storage_limit(
        self,
        max_storage_mb,
    ):
        """
        Prune oldest DDF cache records until the database is
        below the configured storage limit.
        """
        limit_bytes = (
            max_storage_mb
            * 1024
            * 1024
        )

        current_size = (
            self.database_size_bytes()
        )

        while current_size > limit_bytes:
            ddf_properties = (
                Property.objects.filter(
                    category_type=Property.DDF
                )
            )

            # Keep GTA records for as long as possible.
            oldest_ids = list(
                ddf_properties
                .exclude(
                    city__in=self.GTA_CITIES
                )
                .order_by(
                    "modification_timestamp",
                    "id",
                )
                .values_list(
                    "id",
                    flat=True,
                )[:1000]
            )

            if not oldest_ids:
                oldest_ids = list(
                    ddf_properties
                    .order_by(
                        "modification_timestamp",
                        "id",
                    )
                    .values_list(
                        "id",
                        flat=True,
                    )[:1000]
                )

            if not oldest_ids:
                raise CommandError(
                    f"Database is "
                    f"{current_size / 1024 / 1024:.1f} MB, "
                    f"above the "
                    f"{max_storage_mb} MB cap, "
                    "but there are no DDF rows "
                    "left to prune."
                )

            deleted_count, _ = (
                Property.objects
                .filter(
                    id__in=oldest_ids
                )
                .delete()
            )

            self.stdout.write(
                "Storage cap exceeded; "
                f"deleted {deleted_count:,} "
                "old DDF records and "
                "reclaiming disk space."
            )

            self.vacuum_ddf_tables()

            current_size = (
                self.database_size_bytes()
            )

        self.stdout.write(
            f"Database size: "
            f"{current_size / 1024 / 1024:.1f} MB "
            f"(cap: {max_storage_mb} MB)."
        )

    def prune_expired_properties(
        self,
        retention_days,
    ):
        """
        Keep only recent DDF records so the rolling cache
        remains small.
        """
        cutoff = (
            timezone.now()
            - timedelta(
                days=retention_days
            )
        )

        expired = (
            Property.objects
            .filter(
                category_type=Property.DDF
            )
            .filter(
                Q(
                    modification_timestamp__lt=(
                        cutoff
                    )
                )
                | Q(
                    modification_timestamp__isnull=(
                        True
                    )
                )
            )
        )

        expired_count = expired.count()

        if expired_count:
            expired.delete()

            self.stdout.write(
                f"Deleted "
                f"{expired_count:,} "
                "DDF listings older than "
                f"{retention_days} days."
            )

    def cleanup_orphaned_properties(
        self,
        processed_keys,
    ):
        """
        Delete DDF properties not present in a complete set
        of processed listing keys.

        This helper is intentionally not called automatically by
        the rolling-cache sync.
        """
        if not processed_keys:
            return

        current_ddf_count = (
            Property.objects.filter(
                category_type=Property.DDF
            ).count()
        )

        suspiciously_small = (
            len(processed_keys)
            < current_ddf_count * 0.5
            and current_ddf_count > 100
        )

        if suspiciously_small:
            self.stdout.write(
                self.style.ERROR(
                    "ABORTING CLEANUP: Processed "
                    f"{len(processed_keys)} "
                    "listings, which is < 50% "
                    "of current database count "
                    f"({current_ddf_count}). "
                    "This might indicate an "
                    "API failure."
                )
            )
            return

        self.stdout.write(
            "Cleaning up orphaned MLS "
            "properties..."
        )

        orphans = (
            Property.objects
            .filter(
                category_type=Property.DDF
            )
            .exclude(
                listing_key__in=(
                    processed_keys
                )
            )
        )

        orphan_count = (
            orphans.count()
        )

        if orphan_count > 0:
            orphans.delete()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Deleted "
                    f"{orphan_count:,} "
                    "orphaned MLS listings."
                )
            )
        else:
            self.stdout.write(
                "No orphaned listings found."
            )

    def bulk_upsert(
        self,
        properties_data,
        batch_size=5000,
        insert_new_only=False,
        max_storage_mb=280,
    ):
        """
        Persist DDF records in independent batches.

        Separate transactions avoid one enormous transaction
        consuming excessive temporary PostgreSQL storage.
        """
        total_batches = (
            len(properties_data)
            + batch_size
            - 1
        ) // batch_size

        for batch_number, start in enumerate(
            range(
                0,
                len(properties_data),
                batch_size,
            ),
            start=1,
        ):
            batch = properties_data[
                start:start + batch_size
            ]

            self.process_batch(
                batch,
                insert_new_only=(
                    insert_new_only
                ),
            )

            self.enforce_storage_limit(
                max_storage_mb
            )

            self.stdout.write(
                f"Processed batch "
                f"{batch_number}/"
                f"{total_batches}"
            )

    @transaction.atomic
    def process_batch(
        self,
        batch,
        insert_new_only=False,
    ):
        listing_keys = [
            data["ListingKey"]
            for data in batch
            if data.get("ListingKey")
        ]

        existing = (
            Property.objects
            .filter(
                listing_key__in=listing_keys
            )
            .in_bulk(
                field_name="listing_key"
            )
        )

        property_objs = []
        properties_to_update = []

        first_seen_rows = []
        snapshot_rows = []

        # Store child payloads by listing key rather than constructing
        # Room/Media rows immediately. This ensures new Property rows
        # have database IDs before their children are created.
        rooms_by_listing_key = {}
        media_by_listing_key = {}

        for data in batch:
            key = data.get(
                "ListingKey"
            )

            if not key:
                continue

            defaults = (
                map_property_defaults(
                    data
                )
            )

            first_seen_rows.append(
                (
                    key,
                    defaults.get(
                        "modification_timestamp"
                    )
                    or defaults.get(
                        "original_entry_timestamp"
                    ),
                )
            )

            if key in existing:
                if insert_new_only:
                    continue

                prop = existing[key]

                old_price = prop.list_price

                old_status = (
                    prop.standard_status
                    or ""
                ).strip()

                old_modification_timestamp = (
                    prop.modification_timestamp
                )

                new_price = defaults.get(
                    "list_price"
                )

                new_status = (
                    defaults.get(
                        "standard_status"
                    )
                    or ""
                ).strip()

                new_modification_timestamp = (
                    defaults.get(
                        "modification_timestamp"
                    )
                )

                snapshot_changed = (
                    old_price != new_price
                    or old_status
                    != new_status
                    or old_modification_timestamp
                    != new_modification_timestamp
                )

                for field, value in (
                    defaults.items()
                ):
                    setattr(
                        prop,
                        field,
                        value,
                    )

                properties_to_update.append(
                    prop
                )

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
                prop = Property(
                    listing_key=key,
                    **defaults,
                )

                property_objs.append(
                    prop
                )

                snapshot_rows.append(
                    (
                        key,
                        defaults.get(
                            "list_price"
                        ),
                        defaults.get(
                            "standard_status"
                        )
                        or "",
                        defaults.get(
                            "modification_timestamp"
                        ),
                    )
                )

            rooms_by_listing_key[key] = (
                data.get("Rooms")
                or []
            )

            media_by_listing_key[key] = (
                data.get("Media")
                or []
            )

        if property_objs:
            Property.objects.bulk_create(
                property_objs,
                ignore_conflicts=False,
            )

        if properties_to_update:
            update_fields = [
                field.name
                for field
                in Property._meta.fields
                if field.name
                not in {
                    "id",
                    "listing_key",
                }
            ]

            Property.objects.bulk_update(
                properties_to_update,
                fields=update_fields,
            )

        affected_listing_keys = (
            set(
                rooms_by_listing_key.keys()
            )
            | set(
                media_by_listing_key.keys()
            )
        )

        if affected_listing_keys:
            affected_properties = (
                Property.objects
                .filter(
                    listing_key__in=(
                        affected_listing_keys
                    )
                )
                .in_bulk(
                    field_name="listing_key"
                )
            )

            affected_property_ids = [
                prop.id
                for prop
                in affected_properties.values()
            ]

            if affected_property_ids:
                Room.objects.filter(
                    property_id__in=(
                        affected_property_ids
                    )
                ).delete()

                Media.objects.filter(
                    property_id__in=(
                        affected_property_ids
                    )
                ).delete()

            room_objs = []

            for (
                listing_key,
                rooms,
            ) in rooms_by_listing_key.items():
                prop = (
                    affected_properties.get(
                        listing_key
                    )
                )

                if prop is None:
                    continue

                for room_data in rooms:
                    room_objs.append(
                        Room(
                            property=prop,
                            room_type=safe_str(
                                room_data.get(
                                    "RoomType"
                                )
                            ),
                            room_length=(
                                safe_decimal(
                                    room_data.get(
                                        "RoomLength"
                                    )
                                )
                            ),
                            room_width=(
                                safe_decimal(
                                    room_data.get(
                                        "RoomWidth"
                                    )
                                )
                            ),
                            room_level=safe_str(
                                room_data.get(
                                    "RoomLevel"
                                )
                            ),
                            room_description=(
                                safe_str(
                                    room_data.get(
                                        "RoomDescription"
                                    )
                                )
                            ),
                            room_dimensions=(
                                safe_str(
                                    room_data.get(
                                        "RoomDimensions"
                                    )
                                )
                            ),
                            room_length_width_units=(
                                safe_str(
                                    room_data.get(
                                        "RoomLengthWidthUnits"
                                    )
                                )
                            ),
                        )
                    )

            media_objs = []

            for (
                listing_key,
                media_items,
            ) in media_by_listing_key.items():
                prop = (
                    affected_properties.get(
                        listing_key
                    )
                )

                if prop is None:
                    continue

                for media_data in media_items:
                    media_objs.append(
                        Media(
                            property=prop,
                            media_url=safe_str(
                                media_data.get(
                                    "MediaURL"
                                )
                            ),
                            media_category=(
                                safe_str(
                                    media_data.get(
                                        "MediaCategory"
                                    )
                                )
                            ),
                            is_preferred=(
                                safe_bool(
                                    media_data.get(
                                        "PreferredPhotoYN"
                                    )
                                )
                            ),
                            order=safe_int(
                                media_data.get(
                                    "Order"
                                ),
                                999,
                            ),
                        )
                    )

            if room_objs:
                Room.objects.bulk_create(
                    room_objs,
                    ignore_conflicts=True,
                )

            if media_objs:
                Media.objects.bulk_create(
                    media_objs,
                    ignore_conflicts=True,
                )

        if first_seen_rows:
            bulk_record_listing_first_seen(
                first_seen_rows
            )

        if snapshot_rows:
            bulk_record_property_snapshots(
                snapshot_rows
            )


# Normal incremental sync:
# python manage.py sync_ddf_properties --batch-size 8000
#
# Testing with a page cap:
# python manage.py sync_ddf_properties --max-pages 1 --batch-size 500
#
# Priority GTA/Ontario cache:
# python manage.py sync_ddf_properties --priority-cache
#
# NOTE:
# --full is intentionally unsupported for this rolling-cache architecture.