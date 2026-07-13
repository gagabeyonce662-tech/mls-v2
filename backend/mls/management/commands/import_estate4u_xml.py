"""Import Estate4U WordPress property listings into mls_estateproperty.

Place this file at:
    backend/mls/management/commands/import_estate4u_xml.py
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone as datetime_timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from mls.models import EstateProperty


WP_NS = "http://wordpress.org/export/1.2/"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"
EXCERPT_NS = "http://wordpress.org/export/1.2/excerpt/"
DC_NS = "http://purl.org/dc/elements/1.1/"

NS = {
    "wp": WP_NS,
    "content": CONTENT_NS,
    "excerpt": EXCERPT_NS,
    "dc": DC_NS,
}

NUMBER_RE = re.compile(r"\d[\d,]*(?:\.\d+)?")
YEAR_RE = re.compile(r"(?:19|20)\d{2}")

TAXONOMY_MAP = {
    "property_type": "type",
    "property_status": "status",
    "property_feature": "features",
    "property_label": "labels",
    "property_city": "city",
    "property_state": "state",
    "property_country": "country",
}


class Command(BaseCommand):
    help = (
        "Import Estate4U WordPress WXR property records into EstateProperty "
        "while keeping estate-4u.com image URLs remote."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "xml_path",
            help="Path to the WordPress WXR XML export.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help=(
                "Execute and validate database writes inside a transaction, "
                "then roll the entire import back."
            ),
        )
        parser.add_argument(
            "--parse-only",
            action="store_true",
            help="Parse and map the XML without connecting to the database.",
        )
        parser.add_argument(
            "--include-drafts",
            action="store_true",
            help="Also import WordPress draft properties. Published properties are imported by default.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Import only the first N matching properties. Useful for testing.",
        )
        parser.add_argument(
            "--listing-key-prefix",
            default="estate4u-wp-",
            help="Prefix used for deterministic listing_key values.",
        )

    def handle(self, *args, **options):
        if options["dry_run"] and options["parse_only"]:
            raise CommandError("Use either --dry-run or --parse-only, not both.")

        xml_path = Path(options["xml_path"]).expanduser().resolve()
        if not xml_path.is_file():
            raise CommandError(f"XML file does not exist: {xml_path}")

        if options["limit"] is not None and options["limit"] < 1:
            raise CommandError("--limit must be at least 1.")

        self.stdout.write(f"Reading WordPress export: {xml_path}")
        channel = self._parse_channel(xml_path)
        items = channel.findall("item")
        attachment_urls = self._build_attachment_lookup(items)

        property_items = [
            item
            for item in items
            if self._text(item, "wp:post_type") == "property"
        ]

        include_drafts = options["include_drafts"]
        selected_items = []
        skipped_statuses = Counter()

        for item in property_items:
            status = self._text(item, "wp:status") or "draft"
            if status != "publish" and not include_drafts:
                skipped_statuses[status] += 1
                continue
            selected_items.append(item)

        if options["limit"] is not None:
            selected_items = selected_items[: options["limit"]]

        self.stdout.write(
            f"Found {len(property_items)} WordPress properties, "
            f"{len(attachment_urls)} attachment URLs, "
            f"and selected {len(selected_items)} properties."
        )
        if skipped_statuses:
            skipped_text = ", ".join(
                f"{status}={count}" for status, count in sorted(skipped_statuses.items())
            )
            self.stdout.write(f"Skipped by publication status: {skipped_text}")

        mapped_rows = []
        mapping_failures = 0
        prefix = str(options["listing_key_prefix"])

        for item in selected_items:
            post_id = self._text(item, "wp:post_id") or "unknown"
            try:
                mapped_rows.append(
                    self._map_property(
                        item=item,
                        attachment_urls=attachment_urls,
                        listing_key_prefix=prefix,
                    )
                )
            except Exception as exc:
                mapping_failures += 1
                self.stderr.write(
                    self.style.ERROR(f"Could not map WordPress post {post_id}: {exc}")
                )

        if options["parse_only"]:
            self._print_parse_summary(mapped_rows, mapping_failures)
            return

        counters = Counter()
        dry_run = options["dry_run"]

        with transaction.atomic():
            for row in mapped_rows:
                listing_key = row["listing_key"]
                defaults = row["defaults"]
                title = defaults.get("property_title") or listing_key

                try:
                    # The inner transaction creates a savepoint. A bad row can roll
                    # back safely without breaking the remaining import.
                    with transaction.atomic():
                        existing = EstateProperty.objects.filter(
                            listing_key=listing_key
                        ).first()

                        if existing is None:
                            EstateProperty.objects.create(
                                listing_key=listing_key,
                                **defaults,
                            )
                            counters["created"] += 1
                            action = "CREATE"
                        else:
                            changed_fields = [
                                field_name
                                for field_name, value in defaults.items()
                                if getattr(existing, field_name) != value
                            ]

                            if not changed_fields:
                                counters["unchanged"] += 1
                                action = "UNCHANGED"
                            else:
                                for field_name in changed_fields:
                                    setattr(existing, field_name, defaults[field_name])
                                existing.save(update_fields=changed_fields)
                                counters["updated"] += 1
                                action = "UPDATE"

                        if options["verbosity"] >= 2:
                            self.stdout.write(
                                f"{action:9} {listing_key}  {title}"
                            )
                except Exception as exc:
                    counters["failed"] += 1
                    self.stderr.write(
                        self.style.ERROR(
                            f"FAILED    {listing_key}  {title}: {exc}"
                        )
                    )

            if dry_run:
                transaction.set_rollback(True)

        counters["mapping_failed"] = mapping_failures
        self._print_database_summary(counters, dry_run=dry_run)

    def _parse_channel(self, xml_path: Path) -> ET.Element:
        try:
            root = ET.parse(xml_path).getroot()
        except ET.ParseError as exc:
            raise CommandError(f"Invalid XML: {exc}") from exc
        except OSError as exc:
            raise CommandError(f"Could not read XML: {exc}") from exc

        channel = root.find("channel")
        if channel is None:
            raise CommandError("The XML does not contain an RSS channel element.")
        return channel

    def _build_attachment_lookup(self, items: list[ET.Element]) -> dict[str, str]:
        attachment_urls = {}
        for item in items:
            if self._text(item, "wp:post_type") != "attachment":
                continue

            post_id = self._text(item, "wp:post_id")
            if not post_id:
                continue

            attachment_url = self._text(item, "wp:attachment_url")
            if not attachment_url:
                attachment_url = self._text(item, "guid")

            if self._is_http_url(attachment_url):
                attachment_urls[post_id] = attachment_url

        return attachment_urls

    def _map_property(
        self,
        *,
        item: ET.Element,
        attachment_urls: dict[str, str],
        listing_key_prefix: str,
    ) -> dict[str, Any]:
        post_id = self._text(item, "wp:post_id")
        if not post_id:
            raise ValueError("Missing wp:post_id")

        title = self._text(item, "title")
        slug = self._text(item, "wp:post_name")
        publish_status = self._text(item, "wp:status") or "draft"
        description = self._text(item, "content:encoded")
        excerpt = self._text(item, "excerpt:encoded")
        listing_url = self._text(item, "link")
        author = self._text(item, "dc:creator")

        meta = self._collect_meta(item)
        terms, raw_terms = self._collect_terms(item)

        gallery_urls = self._resolve_gallery_urls(meta, attachment_urls)
        featured_image_url = self._resolve_featured_image(
            meta=meta,
            attachment_urls=attachment_urls,
            gallery_urls=gallery_urls,
        )
        if featured_image_url and featured_image_url not in gallery_urls:
            gallery_urls.insert(0, featured_image_url)

        bedrooms_min, bedrooms_max = self._integer_range(
            self._meta_first(meta, "fave_property_bedrooms")
        )
        bathrooms_min, _bathrooms_max = self._integer_range(
            self._meta_first(meta, "fave_property_bathrooms")
        )
        garages_min, _garages_max = self._integer_range(
            self._meta_first(meta, "fave_property_garage")
        )
        area_min, _area_max = self._decimal_range(
            self._meta_first(meta, "fave_property_size")
        )

        explicit_max_bedrooms = self._first_integer(
            self._meta_first(meta, "fave_max-bedroom")
            or self._meta_first(meta, "fave_property_max_bedrooms")
        )
        if explicit_max_bedrooms is not None and explicit_max_bedrooms > 0:
            bedrooms_max = explicit_max_bedrooms

        status_terms = terms.get("status", [])
        type_terms = terms.get("type", [])
        standard_status = status_terms[0] if status_terms else None
        if standard_status is None and any(
            value.strip().lower() == "pre construction" for value in type_terms
        ):
            standard_status = "Pre-Construction"

        city_terms = terms.get("city", [])
        state_terms = terms.get("state", [])
        country_terms = terms.get("country", [])
        label_terms = terms.get("labels", [])
        feature_terms = terms.get("features", [])

        mls_id = self._meta_first(meta, "fave_mls-id")
        property_id_code = (
            self._meta_first(meta, "fave_property_id")
            or mls_id
            or f"WP-{post_id}"
        )

        completion_raw = self._meta_first(meta, "fave_estimated-completion")
        deposit_raw = self._meta_first(meta, "fave_deposit-structure")
        signing_amount = None
        if deposit_raw and "%" not in deposit_raw:
            signing_amount = self._first_decimal(deposit_raw)

        modified_gmt = self._text(item, "wp:post_modified_gmt")
        modified_local = self._text(item, "wp:post_modified")
        modification_timestamp = self._parse_wordpress_datetime(
            modified_gmt or modified_local
        )

        meta_for_json = dict(meta)
        meta_for_json["gallery_image_urls"] = gallery_urls
        meta_for_json["featured_image_url"] = featured_image_url

        canonical_terms = {
            **terms,
            "raw_taxonomies": raw_terms,
        }

        wp_post_json = {
            "source": "wordpress_wxr",
            "post_id": post_id,
            "post_title": title,
            "post_name": slug,
            "post_status": publish_status,
            "post_date": self._text(item, "wp:post_date"),
            "post_date_gmt": self._text(item, "wp:post_date_gmt"),
            "post_modified": modified_local,
            "post_modified_gmt": modified_gmt,
            "post_parent": self._text(item, "wp:post_parent"),
            "menu_order": self._text(item, "wp:menu_order"),
            "author": author,
            "guid": self._text(item, "guid"),
            "permalink": listing_url,
            "excerpt": excerpt,
            "images": gallery_urls,
            "gallery": gallery_urls,
        }

        detail_items = self._compact_detail_items(
            [
                ("Developer", self._meta_first(meta, "fave_developer")),
                ("Estimated completion", completion_raw),
                ("Deposit structure", deposit_raw),
                ("Property types", ", ".join(type_terms)),
                ("Features", ", ".join(feature_terms)),
            ]
        )
        custom_detail_blocks = (
            [
                {
                    "id": "wordpress-project-details",
                    "title": "Project details",
                    "order": 0,
                    "items": detail_items,
                }
            ]
            if detail_items
            else []
        )

        description_sections = (
            [
                {
                    "id": "wordpress-overview",
                    "title": "Overview",
                    "body_html": description,
                    "order": 0,
                }
            ]
            if description
            else []
        )

        defaults = {
            "listing_id": mls_id or f"wp-{post_id}",
            "property_title": title or None,
            "property_slug": self._truncate(slug, 255),
            "publish_status": self._truncate(publish_status, 32),
            "property_description": description or None,
            "featured_image_url": featured_image_url or None,
            "listing_url": self._truncate(listing_url, 200),
            "list_price": self._first_decimal(
                self._meta_first(meta, "fave_property_price")
            ),
            "second_price": self._first_decimal(
                self._meta_first(meta, "fave_property_sec_price")
            ),
            "enable_price_placeholder": self._to_bool(
                self._meta_first(meta, "fave_show_price_placeholder")
            ),
            "price_placeholder": self._truncate(
                self._meta_first(meta, "fave_property_price_placeholder"), 255
            ),
            "price_prefix": self._truncate(
                self._meta_first(meta, "fave_property_price_prefix"), 255
            ),
            "after_price": self._truncate(
                self._meta_first(meta, "fave_property_price_postfix"), 255
            ),
            "building_area_total": area_min,
            "size_postfix": self._truncate(
                self._meta_first(meta, "fave_property_size_prefix")
                or self._meta_first(meta, "fave_property_size_postfix"),
                64,
            ),
            "land_area": self._first_decimal(
                self._meta_first(meta, "fave_property_land")
            ),
            "land_area_size_postfix": self._truncate(
                self._meta_first(meta, "fave_property_land_postfix"), 64
            ),
            "bedrooms_total": bedrooms_min,
            "rooms": self._first_integer(
                self._meta_first(meta, "fave_property_rooms")
            ),
            "bathrooms_total_integer": bathrooms_min,
            "garages": garages_min,
            "garage_size": self._truncate(
                self._meta_first(meta, "fave_property_garage_size"), 128
            ),
            "year_built": self._first_integer(
                self._meta_first(meta, "fave_property_year")
            ),
            "property_id_code": self._truncate(property_id_code, 128),
            "max_bedrooms": bedrooms_max,
            "developer": self._meta_first(meta, "fave_developer") or None,
            "occupancy_year": self._extract_year(completion_raw),
            "signing_amount": signing_amount,
            "lot_size": self._truncate(
                self._meta_first(meta, "fave_lot-size")
                or self._meta_first(meta, "fave_property_lot_size"),
                128,
            ),
            "kitchens": self._first_integer(
                self._meta_first(meta, "fave_kitchens")
                or self._meta_first(meta, "fave_property_kitchens")
            ),
            "tax_annual_amount": self._first_decimal(
                self._meta_first(meta, "fave_taxes")
            ),
            "tax_year": self._first_integer(
                self._meta_first(meta, "fave_tax-year")
            ),
            "basement": self._meta_first(meta, "fave_basement") or None,
            "exterior_features": self._meta_first(meta, "fave_exterior") or None,
            "unparsed_address": self._truncate(
                self._meta_first(meta, "fave_property_address")
                or self._meta_first(meta, "fave_property_map_address")
                or title,
                2000,
            ),
            "city": self._truncate(city_terms[0] if city_terms else None, 2000),
            "state_or_province": self._truncate(
                state_terms[0] if state_terms else None, 2000
            ),
            "postal_code": self._truncate(
                self._meta_first(meta, "fave_property_zip"), 20
            ),
            "country": self._truncate(
                country_terms[0] if country_terms else None, 50
            ),
            "latitude": self._first_decimal(
                self._meta_first(meta, "houzez_geolocation_lat")
            ),
            "longitude": self._first_decimal(
                self._meta_first(meta, "houzez_geolocation_long")
            ),
            "standard_status": self._truncate(standard_status, 50),
            "modification_timestamp": modification_timestamp,
            "is_featured": self._to_bool(
                self._meta_first(meta, "fave_featured")
            ),
            "custom_tags": ", ".join(label_terms) or None,
            "wp_meta_json": meta_for_json,
            "wp_terms_json": canonical_terms,
            "wp_post_json": wp_post_json,
            "description_sections_json": description_sections,
            "custom_detail_blocks_json": custom_detail_blocks,
            "detail_blocks_layout_json": [],
            "listing_buttons_json": [],
        }

        return {
            "listing_key": f"{listing_key_prefix}{post_id}",
            "defaults": defaults,
        }

    def _collect_meta(self, item: ET.Element) -> dict[str, Any]:
        meta: dict[str, Any] = {}

        for postmeta in item.findall("wp:postmeta", NS):
            key = self._text(postmeta, "wp:meta_key")
            if not key:
                continue
            value = self._text(postmeta, "wp:meta_value")

            if key not in meta:
                meta[key] = value
            elif isinstance(meta[key], list):
                meta[key].append(value)
            else:
                meta[key] = [meta[key], value]

        return meta

    def _collect_terms(
        self, item: ET.Element
    ) -> tuple[dict[str, list[str]], dict[str, list[dict[str, str]]]]:
        canonical: dict[str, list[str]] = {
            "type": [],
            "status": [],
            "features": [],
            "labels": [],
            "city": [],
            "state": [],
            "country": [],
        }
        raw: dict[str, list[dict[str, str]]] = {}

        for category in item.findall("category"):
            domain = str(category.attrib.get("domain") or "").strip()
            if not domain.startswith("property_"):
                continue

            name = str(category.text or "").strip()
            slug = str(category.attrib.get("nicename") or "").strip()
            raw.setdefault(domain, []).append({"name": name, "slug": slug})

            canonical_key = TAXONOMY_MAP.get(domain)
            if canonical_key and name and name not in canonical[canonical_key]:
                canonical[canonical_key].append(name)

        return canonical, raw

    def _resolve_gallery_urls(
        self,
        meta: dict[str, Any],
        attachment_urls: dict[str, str],
    ) -> list[str]:
        urls = []
        seen = set()

        for attachment_id in self._meta_values(meta, "fave_property_images"):
            url = attachment_urls.get(str(attachment_id).strip(), "")
            if url and url not in seen:
                seen.add(url)
                urls.append(url)

        return urls

    def _resolve_featured_image(
        self,
        *,
        meta: dict[str, Any],
        attachment_urls: dict[str, str],
        gallery_urls: list[str],
    ) -> str:
        thumbnail_id = self._meta_first(meta, "_thumbnail_id")
        if thumbnail_id:
            thumbnail_url = attachment_urls.get(thumbnail_id, "")
            if thumbnail_url:
                return thumbnail_url

        for key in (
            "_yoast_wpseo_opengraph-image",
            "fave_property_featured_image",
            "featured_image_url",
        ):
            candidate = self._meta_first(meta, key)
            if self._is_http_url(candidate):
                return candidate

        return gallery_urls[0] if gallery_urls else ""

    def _print_parse_summary(
        self,
        mapped_rows: list[dict[str, Any]],
        mapping_failures: int,
    ) -> None:
        status_counts = Counter(
            row["defaults"].get("standard_status") or "Unspecified"
            for row in mapped_rows
        )
        gallery_count = sum(
            len(row["defaults"]["wp_meta_json"].get("gallery_image_urls", []))
            for row in mapped_rows
        )

        self.stdout.write(self.style.SUCCESS("Parse-only validation completed."))
        self.stdout.write(f"Mapped rows: {len(mapped_rows)}")
        self.stdout.write(f"Mapping failures: {mapping_failures}")
        self.stdout.write(f"Remote gallery URLs linked: {gallery_count}")
        self.stdout.write(
            "Statuses: "
            + ", ".join(
                f"{name}={count}" for name, count in sorted(status_counts.items())
            )
        )

        if mapped_rows:
            self.stdout.write("Sample mapped listings:")
            for row in mapped_rows[:5]:
                defaults = row["defaults"]
                image_count = len(
                    defaults["wp_meta_json"].get("gallery_image_urls", [])
                )
                self.stdout.write(
                    f"  {row['listing_key']} | "
                    f"{defaults.get('property_title')} | "
                    f"{defaults.get('city')} | "
                    f"price={defaults.get('list_price')} | "
                    f"images={image_count}"
                )

    def _print_database_summary(self, counters: Counter, *, dry_run: bool) -> None:
        prefix = "DRY RUN — would have " if dry_run else "Import completed — "
        message = (
            f"{prefix}created={counters['created']}, "
            f"updated={counters['updated']}, "
            f"unchanged={counters['unchanged']}, "
            f"failed={counters['failed']}, "
            f"mapping_failed={counters['mapping_failed']}."
        )
        self.stdout.write(self.style.SUCCESS(message))
        if dry_run:
            self.stdout.write(
                self.style.WARNING("No database changes were committed.")
            )

    @staticmethod
    def _text(element: ET.Element, path: str) -> str:
        value = element.findtext(path, default="", namespaces=NS)
        return str(value or "").strip()

    @staticmethod
    def _meta_values(meta: dict[str, Any], key: str) -> list[str]:
        value = meta.get(key)
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item or "").strip() for item in value]
        return [str(value or "").strip()]

    @classmethod
    def _meta_first(cls, meta: dict[str, Any], key: str) -> str:
        for value in cls._meta_values(meta, key):
            if value:
                return value
        return ""

    @staticmethod
    def _is_http_url(value: Any) -> bool:
        text = str(value or "").strip().lower()
        return text.startswith("http://") or text.startswith("https://")

    @staticmethod
    def _truncate(value: Any, max_length: int) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text[:max_length] if text else None

    @staticmethod
    def _to_bool(value: Any) -> bool:
        if isinstance(value, bool):
            return value
        return str(value or "").strip().lower() in {
            "1",
            "true",
            "yes",
            "y",
            "on",
            "show",
        }

    @staticmethod
    def _numbers(value: Any) -> list[Decimal]:
        text = str(value or "").replace("\xa0", " ")
        numbers = []
        for match in NUMBER_RE.findall(text):
            try:
                numbers.append(Decimal(match.replace(",", "")))
            except InvalidOperation:
                continue
        return numbers

    @classmethod
    def _first_decimal(cls, value: Any) -> Decimal | None:
        numbers = cls._numbers(value)
        return numbers[0] if numbers else None

    @classmethod
    def _decimal_range(
        cls, value: Any
    ) -> tuple[Decimal | None, Decimal | None]:
        numbers = cls._numbers(value)
        if not numbers:
            return None, None
        return min(numbers), max(numbers)

    @classmethod
    def _first_integer(cls, value: Any) -> int | None:
        number = cls._first_decimal(value)
        return int(number) if number is not None else None

    @classmethod
    def _integer_range(cls, value: Any) -> tuple[int | None, int | None]:
        minimum, maximum = cls._decimal_range(value)
        if minimum is None:
            return None, None
        return int(minimum), int(maximum)

    @staticmethod
    def _extract_year(value: Any) -> int | None:
        match = YEAR_RE.search(str(value or ""))
        return int(match.group(0)) if match else None

    @staticmethod
    def _parse_wordpress_datetime(value: str) -> datetime | None:
        text = str(value or "").strip()
        if not text or text == "0000-00-00 00:00:00":
            return None
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
        return parsed.replace(tzinfo=datetime_timezone.utc)

    @staticmethod
    def _compact_detail_items(
        entries: list[tuple[str, Any]],
    ) -> list[dict[str, str]]:
        items = []
        for label, value in entries:
            text = str(value or "").strip()
            if text:
                items.append({"label": label, "value": text})
        return items
