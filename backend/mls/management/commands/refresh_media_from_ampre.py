"""
Replace dead DDF CDN gallery URLs with live AMPRE (TRREB) MediaURLs.

Examples:
  python manage.py refresh_media_from_ampre --listing-id W12914842
  python manage.py refresh_media_from_ampre --dead-preferred --limit 50
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed

from django.core.management.base import BaseCommand, CommandError

from mls.models import Property
from mls.services.ampre_client import AmpreClientError
from mls.services.ampre_media import (
    refresh_property_media_from_ampre,
    url_ok,
)


class Command(BaseCommand):
    help = "Refresh listing gallery URLs from AMPRE when DDF CDN links are dead."

    def add_arguments(self, parser):
        parser.add_argument(
            "--listing-id",
            action="append",
            dest="listing_ids",
            default=[],
            help="MLS® number (listing_id), repeatable.",
        )
        parser.add_argument(
            "--listing-key",
            action="append",
            dest="listing_keys",
            default=[],
            help="Internal listing_key, repeatable.",
        )
        parser.add_argument(
            "--dead-preferred",
            action="store_true",
            help="Scan active listings whose preferred ddfcdn photo 404s.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=40,
            help="Max listings to repair in --dead-preferred mode (default 40).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Refresh from AMPRE even if the current preferred URL is healthy.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Fetch and report without writing.",
        )

    def handle(self, *args, **options):
        targets: list[Property] = []
        listing_ids = options["listing_ids"] or []
        listing_keys = options["listing_keys"] or []

        if listing_ids:
            targets.extend(list(Property.objects.filter(listing_id__in=listing_ids)))
        if listing_keys:
            targets.extend(list(Property.objects.filter(listing_key__in=listing_keys)))
        if options["dead_preferred"]:
            targets.extend(self._find_dead_preferred(limit=max(1, options["limit"])))

        seen: set[int] = set()
        unique_targets: list[Property] = []
        for prop in targets:
            if prop.pk in seen:
                continue
            seen.add(prop.pk)
            unique_targets.append(prop)

        if not unique_targets:
            raise CommandError(
                "No properties selected. Pass --listing-id / --listing-key "
                "or --dead-preferred."
            )

        repaired = 0
        for prop in unique_targets:
            listing_id = (prop.listing_id or "").strip()
            label = f"{listing_id or prop.listing_key} ({prop.unparsed_address or prop.listing_key})"
            if not listing_id:
                self.stdout.write(self.style.WARNING(f"Skip {label}: no listing_id"))
                continue

            if not options["force"]:
                preferred = (
                    prop.media.filter(is_preferred=True).order_by("order", "pk").first()
                    or prop.media.order_by("order", "pk").first()
                )
                if (
                    preferred
                    and preferred.media_url
                    and "ampre.ca" in preferred.media_url
                    and url_ok(preferred.media_url)
                ):
                    self.stdout.write(f"{label}: already on healthy AMPRE URL")
                    continue

            if options["dry_run"]:
                self.stdout.write(f"DRY-RUN {label}: would refresh from AMPRE")
                continue

            try:
                count = refresh_property_media_from_ampre(prop)
            except AmpreClientError as exc:
                self.stdout.write(self.style.ERROR(f"{label}: {exc}"))
                continue

            if count:
                repaired += 1
                self.stdout.write(self.style.SUCCESS(f"{label}: wrote {count} photos"))
            else:
                self.stdout.write(self.style.WARNING(f"{label}: no AMPRE photos written"))

        self.stdout.write(self.style.NOTICE(f"Repaired {repaired} listing(s)."))

    def _find_dead_preferred(self, limit: int) -> list[Property]:
        rows = list(
            Property.objects.filter(
                standard_status="Active",
                media__is_preferred=True,
                media__media_url__istartswith="https://ddfcdn.realtor.ca",
            )
            .exclude(listing_id="")
            .order_by("-photos_count", "id")
            .distinct()[: max(limit * 4, 40)]
        )

        dead: list[Property] = []
        with ThreadPoolExecutor(max_workers=16) as pool:
            futures = {}
            for prop in rows:
                preferred = (
                    prop.media.filter(is_preferred=True).order_by("order", "pk").first()
                )
                if not preferred or not preferred.media_url:
                    continue
                futures[pool.submit(url_ok, preferred.media_url)] = prop
            for future in as_completed(futures):
                prop = futures[future]
                if not future.result():
                    dead.append(prop)
                    if len(dead) >= limit:
                        break
        return dead[:limit]
