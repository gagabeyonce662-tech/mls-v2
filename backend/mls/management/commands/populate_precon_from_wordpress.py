from __future__ import annotations

import html
import mimetypes
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone as datetime_timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from mls.models import (
    Attachment,
    ContentMeta,
    PreComProperty,
    Taxonomy,
)


WP_NS = "http://wordpress.org/export/1.2/"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"
EXCERPT_NS = "http://wordpress.org/export/1.2/excerpt/"

NS = {
    "wp": WP_NS,
    "content": CONTENT_NS,
    "excerpt": EXCERPT_NS,
}

TARGET_WP_IDS = {
    18312,
    18319,
    18943,
    18954,
}

URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)
YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
NUMBER_RE = re.compile(r"\d[\d,]*(?:\.\d+)?")


class SectionListParser(HTMLParser):
    """
    Extract list items grouped under their nearest preceding heading.
    """

    def __init__(self) -> None:
        super().__init__()
        self.current_heading = ""
        self.current_tag: str | None = None
        self.current_chunks: list[str] = []
        self.sections: dict[str, list[str]] = defaultdict(list)

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6", "li"}:
            self.current_tag = tag
            self.current_chunks = []

    def handle_data(self, data: str) -> None:
        if self.current_tag:
            self.current_chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != self.current_tag:
            return

        value = clean_text(" ".join(self.current_chunks))

        if tag.startswith("h"):
            self.current_heading = value.lower()
        elif tag == "li" and value:
            self.sections[self.current_heading].append(value)

        self.current_tag = None
        self.current_chunks = []


def clean_text(value: str | None) -> str:
    if not value:
        return ""

    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)

    return value.strip()


def first_value(
    meta: dict[str, list[str]],
    *keys: str,
) -> str:
    for key in keys:
        values = meta.get(key, [])

        for value in values:
            value = value.strip()

            if value:
                return value

    return ""


def all_values(
    meta: dict[str, list[str]],
    *keys: str,
) -> list[str]:
    output: list[str] = []

    for key in keys:
        for value in meta.get(key, []):
            value = value.strip()

            if value and value not in output:
                output.append(value)

    return output


def parse_datetime(value: str) -> datetime | None:
    value = value.strip()

    if not value or value.startswith("0000-00-00"):
        return None

    formats = (
        "%Y-%m-%d %H:%M:%S",
        "%a, %d %b %Y %H:%M:%S %z",
    )

    for date_format in formats:
        try:
            parsed = datetime.strptime(value, date_format)

            if parsed.tzinfo is None:
                parsed = parsed.replace(
                    tzinfo=datetime_timezone.utc,
                )

            return parsed
        except ValueError:
            continue

    return None


def extract_links(source_html: str) -> list[str]:
    links: list[str] = []

    for match in URL_RE.findall(html.unescape(source_html)):
        url = match.rstrip(").,;")

        if url not in links:
            links.append(url)

    return links


def find_document_url(
    urls: list[str],
    keywords: tuple[str, ...],
) -> str:
    for url in urls:
        normalized = url.lower()

        if any(keyword in normalized for keyword in keywords):
            return url

    return ""


def collect_sections(source_html: str) -> dict[str, list[str]]:
    parser = SectionListParser()
    parser.feed(source_html)
    return dict(parser.sections)


def section_items(
    sections: dict[str, list[str]],
    *keywords: str,
) -> list[str]:
    output: list[str] = []

    for heading, items in sections.items():
        normalized_heading = heading.lower()

        if not any(
            keyword.lower() in normalized_heading
            for keyword in keywords
        ):
            continue

        for item in items:
            if item not in output:
                output.append(item)

    return output

def split_compound_items(
    items: list[str],
) -> list[str]:
    """
    Split WordPress list items containing multiple values.

    Important:
    - Split on // and |
    - Split on commas only when the comma introduces another dollar value
    - Do not split thousands such as $5,000 or $10,000
    """
    output: list[str] = []

    for item in items:
        parts = re.split(
            r"\s*(?://+|\|)\s*|,\s*(?=\$)",
            item,
        )

        for part in parts:
            value = clean_text(part)

            if value and value not in output:
                output.append(value)

    return output

def extract_inline_highlight(
    items: list[str],
    label: str,
) -> str:
    normalized_label = label.lower()

    for item in items:
        if normalized_label not in item.lower():
            continue

        _, separator, value = item.partition(":")

        if separator and value.strip():
            return value.strip()

    return ""


def detect_mime_type(url: str) -> str:
    parsed_path = urlparse(url).path
    mime_type, _ = mimetypes.guess_type(parsed_path)

    if mime_type:
        return mime_type

    if "drive.google.com" in url:
        return "application/vnd.google-apps.folder"

    return "application/octet-stream"


def image_title(
    property_title: str,
    index: int,
) -> str:
    if index == 0:
        return f"{property_title} featured image"

    return f"{property_title} gallery image {index + 1}"


class Command(BaseCommand):
    help = (
        "Populate the four selected PreComProperty records from the "
        "Estate4U WordPress XML export."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "xml_path",
            help="Path to the Estate4U WordPress XML export.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform all work and then roll the transaction back.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        xml_path = Path(options["xml_path"]).expanduser().resolve()
        dry_run = options["dry_run"]

        if not xml_path.is_file():
            raise CommandError(
                f"WordPress XML file does not exist: {xml_path}"
            )

        try:
            root = ET.parse(xml_path).getroot()
        except ET.ParseError as exc:
            raise CommandError(f"Invalid WordPress XML: {exc}") from exc

        channel = root.find("channel")

        if channel is None:
            raise CommandError(
                "The WordPress XML has no RSS channel element."
            )

        items = channel.findall("item")

        attachment_urls = self.build_attachment_lookup(items)
        properties = self.build_property_lookup(items)

        missing_source_ids = sorted(
            TARGET_WP_IDS.difference(properties.keys())
        )

        if missing_source_ids:
            raise CommandError(
                "These properties were not found in the XML: "
                + ", ".join(str(value) for value in missing_source_ids)
            )

        counters = {
            "properties": 0,
            "meta": 0,
            "attachments": 0,
            "taxonomies": 0,
        }

        with transaction.atomic():
            for wp_id in sorted(TARGET_WP_IDS):
                item = properties[wp_id]

                result = self.populate_property(
                    wp_id=wp_id,
                    item=item,
                    attachment_urls=attachment_urls,
                )

                counters["properties"] += 1
                counters["meta"] += result["meta"]
                counters["attachments"] += result["attachments"]
                counters["taxonomies"] += result["taxonomies"]

            if dry_run:
                transaction.set_rollback(True)

        prefix = "DRY RUN completed" if dry_run else "Import completed"

        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}: "
                f"properties={counters['properties']}, "
                f"meta={counters['meta']}, "
                f"attachments={counters['attachments']}, "
                f"taxonomies={counters['taxonomies']}"
            )
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "No database changes were committed."
                )
            )

    def build_attachment_lookup(
        self,
        items: list[ET.Element],
    ) -> dict[str, str]:
        lookup: dict[str, str] = {}

        for item in items:
            post_type = self.text(item, "wp:post_type")

            if post_type != "attachment":
                continue

            post_id = self.text(item, "wp:post_id")

            if not post_id:
                continue

            url = (
                self.text(item, "wp:attachment_url")
                or self.text(item, "guid")
            )

            if url.startswith(("http://", "https://")):
                lookup[post_id] = url

        return lookup

    def build_property_lookup(
        self,
        items: list[ET.Element],
    ) -> dict[int, ET.Element]:
        lookup: dict[int, ET.Element] = {}

        for item in items:
            if self.text(item, "wp:post_type") != "property":
                continue

            raw_post_id = self.text(item, "wp:post_id")

            try:
                post_id = int(raw_post_id)
            except (TypeError, ValueError):
                continue

            if post_id in TARGET_WP_IDS:
                lookup[post_id] = item

        return lookup

    def populate_property(
        self,
        *,
        wp_id: int,
        item: ET.Element,
        attachment_urls: dict[str, str],
    ) -> dict[str, int]:
        try:
            prop = (
                PreComProperty.objects
                .select_related("content")
                .get(content__wp_id=wp_id)
            )
        except PreComProperty.DoesNotExist as exc:
            raise CommandError(
                f"PreComProperty for WordPress ID {wp_id} does not exist."
            ) from exc

        content = prop.content

        title = self.text(item, "title") or content.title
        source_html = self.text(item, "content:encoded")
        excerpt = self.text(item, "excerpt:encoded")
        status = self.text(item, "wp:status") or "publish"
        slug = self.text(item, "wp:post_name") or content.slug
        published_at = parse_datetime(
            self.text(item, "wp:post_date_gmt")
            or self.text(item, "wp:post_date")
            or self.text(item, "pubDate")
        )

        meta = self.collect_meta(item)
        taxonomies = self.collect_taxonomies(item)

        sections = collect_sections(source_html)
        all_highlights = section_items(
            sections,
            "highlight",
            "project detail",
        )

        deposit_items = split_compound_items(
            section_items(
                sections,
                "deposit",
            )
        )

        incentive_items = split_compound_items(
        section_items(
            sections,
            "incentive",
        )
    )

        amenity_items = section_items(
            sections,
            "amenit",
            "location",
            "nearby",
        )

        inline_incentives = extract_inline_highlight(
            all_highlights,
            "incentive",
        )

        if inline_incentives and not incentive_items:
            incentive_items = split_compound_items(
                [inline_incentives]
            )

        property_types = [
            taxonomy["name"]
            for taxonomy in taxonomies
            if taxonomy["taxonomy"] == "property_type"
            and taxonomy["name"].lower()
            not in {"pre construction", "pre-construction"}
        ]

        city = self.taxonomy_value(
            taxonomies,
            "property_city",
        )

        province = self.taxonomy_value(
            taxonomies,
            "property_state",
        )

        country = self.taxonomy_value(
            taxonomies,
            "property_country",
        )

        gallery_ids = all_values(
            meta,
            "fave_property_images",
        )

        gallery_urls: list[str] = []

        for attachment_id in gallery_ids:
            url = attachment_urls.get(attachment_id, "")

            if url and url not in gallery_urls:
                gallery_urls.append(url)

        thumbnail_id = first_value(meta, "_thumbnail_id")
        featured_image_url = attachment_urls.get(
            thumbnail_id,
            "",
        )

        if not featured_image_url and gallery_urls:
            featured_image_url = gallery_urls[0]

        if (
            featured_image_url
            and featured_image_url not in gallery_urls
        ):
            gallery_urls.insert(0, featured_image_url)

        source_urls = extract_links(source_html)

        floor_plan_url = find_document_url(
            source_urls,
            (
                "drive.google.com",
                "floor",
                "plan",
            ),
        )

        brochure_url = find_document_url(
            source_urls,
            (
                "brochure",
            ),
        )

        price_list_url = find_document_url(
            source_urls,
            (
                "price-list",
                "pricelist",
                "price_list",
            ),
        )

        developer = first_value(
            meta,
            "fave_developer",
            "developer",
        )

        completion = first_value(
            meta,
            "fave_estimated-completion",
            "fave_estimated_completion",
        )

        bedrooms_min = first_value(
            meta,
            "fave_property_bedrooms",
        ) or str(prop.bedrooms or "")

        bedrooms_max = first_value(
            meta,
            "fave_max_bedrooms",
            "fave_property_max_bedrooms",
        ) or bedrooms_min

        bathrooms_min = first_value(
            meta,
            "fave_property_bathrooms",
        ) or str(prop.bathrooms or "")

        bathrooms_max = first_value(
            meta,
            "fave_max_bathrooms",
            "fave_property_max_bathrooms",
        ) or bathrooms_min

        area_min = first_value(
            meta,
            "fave_property_size",
        ) or str(prop.area or "")

        area_max = first_value(
            meta,
            "fave_property_size_max",
            "fave_max_property_size",
            "fave_property_max_size",
        ) or area_min

        area_unit = first_value(
            meta,
            "fave_property_size_prefix",
            "fave_property_size_postfix",
        ) or "Sq. Ft."

        garage_count = first_value(
            meta,
            "fave_property_garage",
            "fave_property_garages",
        ) or str(prop.garages or "")

        deposit_raw = first_value(
            meta,
            "fave_deposit-structure",
            "fave_deposit_structure",
        )

        seo_title = first_value(
            meta,
            "_yoast_wpseo_title",
        )

        seo_description = first_value(
            meta,
            "_yoast_wpseo_metadesc",
        )

        price_prefix = first_value(
            meta,
            "fave_property_price_prefix",
        )

        price_suffix = first_value(
            meta,
            "fave_property_price_postfix",
        )

        price_display = self.format_price_display(
            prop.price,
            prefix=price_prefix,
            suffix=price_suffix,
        )

        content.title = title
        content.slug = slug
        content.status = status
        content.content_type = "property"
        content.content = source_html
        content.excerpt = (
            excerpt
            or self.make_excerpt(source_html)
        )
        content.published_at = published_at
        content.save(
            update_fields=[
                "title",
                "slug",
                "status",
                "content_type",
                "content",
                "excerpt",
                "published_at",
            ]
        )

        demo_values = {
            # DEMO VALUES — replace if the client provides exact values.
            "project_status": "Selling",
            "sales_status": "Now Selling",
            "construction_status": "Pre-Construction",
            "listing_badge": "Pre-Construction",
            "availability_label": "Now Selling",
        }

        meta_values = {
            "developer": developer,
            "occupancy_year": completion,
            "estimated_completion": completion,
            "city": city,
            "province": province or "Ontario",
            "country": country or "Canada",
            "location_display": ", ".join(
                value
                for value in (
                    city,
                    province or "Ontario",
                )
                if value
            ),
            "bedrooms_min": bedrooms_min,
            "bedrooms_max": bedrooms_max,
            "bathrooms_min": bathrooms_min,
            "bathrooms_max": bathrooms_max,
            "area_min": area_min,
            "area_max": area_max,
            "area_unit": area_unit,
            "garage_count": garage_count,
            "property_types": ", ".join(property_types),
            "property_style": ", ".join(property_types),
            "price_display": price_display,
            "deposit_structure": ";".join(deposit_items),
            "deposit_total_percentage": deposit_raw,
            "incentives": "|".join(incentive_items),
            "amenities": "|".join(amenity_items),
            "featured_image_url": featured_image_url,
            "floor_plan_url": floor_plan_url,
            "brochure_url": brochure_url,
            "price_list_url": price_list_url,
            "seo_title": seo_title,
            "seo_description": seo_description,
            "source": "wordpress",
            "source_wp_id": str(wp_id),
            **demo_values,
        }

        meta_count = 0

        for key, value in meta_values.items():
            value = str(value or "").strip()

            if not value:
                continue

            ContentMeta.objects.update_or_create(
                content=content,
                key=key,
                defaults={"value": value},
            )

            meta_count += 1

        attachment_count = 0

        for index, url in enumerate(gallery_urls):
            Attachment.objects.update_or_create(
                content=content,
                url=url,
                defaults={
                    "mime_type": detect_mime_type(url),
                    "title": image_title(title, index),
                },
            )

            attachment_count += 1

        documents = (
            ("Floor plans", floor_plan_url),
            ("Project brochure", brochure_url),
            ("Price list", price_list_url),
        )

        for label, url in documents:
            if not url:
                continue

            Attachment.objects.update_or_create(
                content=content,
                url=url,
                defaults={
                    "mime_type": detect_mime_type(url),
                    "title": f"{title} {label.lower()}",
                },
            )

            attachment_count += 1

        taxonomy_objects: list[Taxonomy] = []

        for taxonomy_data in taxonomies:
            taxonomy_object, _ = Taxonomy.objects.update_or_create(
                wp_id=taxonomy_data["wp_id"],
                defaults={
                    "taxonomy": taxonomy_data["taxonomy"],
                    "name": taxonomy_data["name"],
                    "slug": taxonomy_data["slug"],
                    "description": "",
                },
            )

            taxonomy_objects.append(taxonomy_object)

        content.taxonomies.set(taxonomy_objects)

        self.stdout.write(
            self.style.SUCCESS(
                f"POPULATED {wp_id}: {title} | "
                f"meta={meta_count}, "
                f"attachments={attachment_count}, "
                f"taxonomies={len(taxonomy_objects)}"
            )
        )

        return {
            "meta": meta_count,
            "attachments": attachment_count,
            "taxonomies": len(taxonomy_objects),
        }

    def collect_meta(
        self,
        item: ET.Element,
    ) -> dict[str, list[str]]:
        output: dict[str, list[str]] = defaultdict(list)

        for meta_element in item.findall("wp:postmeta", NS):
            key = self.text(meta_element, "wp:meta_key")
            value = self.text(meta_element, "wp:meta_value")

            if key:
                output[key].append(value)

        return dict(output)

    def collect_taxonomies(
        self,
        item: ET.Element,
    ) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()

        for index, category in enumerate(
            item.findall("category"),
            start=1,
        ):
            taxonomy = category.attrib.get("domain", "").strip()
            nicename = category.attrib.get("nicename", "").strip()
            name = clean_text(category.text)

            if not taxonomy or not name:
                continue

            taxonomy_slug = nicename or slugify(name)
            key = (taxonomy, taxonomy_slug)

            if key in seen:
                continue

            seen.add(key)

            synthetic_wp_id = -(
                int(self.text(item, "wp:post_id")) * 1000
                + index
            )

            output.append(
                {
                    "wp_id": synthetic_wp_id,
                    "taxonomy": taxonomy,
                    "name": name,
                    "slug": taxonomy_slug,
                }
            )

        return output

    @staticmethod
    def taxonomy_value(
        taxonomies: list[dict[str, Any]],
        taxonomy_name: str,
    ) -> str:
        for item in taxonomies:
            if item["taxonomy"] == taxonomy_name:
                return item["name"]

        return ""

    @staticmethod
    def format_price_display(
        value: Any,
        *,
        prefix: str,
        suffix: str,
    ) -> str:
        if value is None:
            return "Contact for pricing"

        try:
            amount = f"${float(value):,.0f}"
        except (TypeError, ValueError):
            return "Contact for pricing"

        parts = [
            prefix.strip() or "Starting from",
            amount,
            suffix.strip(),
        ]

        return " ".join(
            part for part in parts if part
        )

    @staticmethod
    def make_excerpt(source_html: str) -> str:
        plain_text = clean_text(source_html)

        if len(plain_text) <= 240:
            return plain_text

        return plain_text[:237].rstrip() + "..."

    @staticmethod
    def text(
        element: ET.Element,
        path: str,
    ) -> str:
        value = element.findtext(
            path,
            default="",
            namespaces=NS,
        )

        return str(value or "").strip()


