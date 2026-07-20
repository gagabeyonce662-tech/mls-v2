from __future__ import annotations

import csv
import html
import json
from collections import Counter
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from mls.management.commands.import_estate4u_xml import (
    Command as EstateXmlImportCommand,
)
from mls.services.estate_content import parse_estate_content


class Command(BaseCommand):
    help = (
        "Create a read-only audit report from an Estate4U WordPress XML export. "
        "This command does not write to the database."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "xml_path",
            help="Path to the WordPress WXR XML export.",
        )
        parser.add_argument(
            "--output-dir",
            default="reports/estate4u-audit",
            help="Directory where audit files will be created.",
        )
        parser.add_argument(
            "--include-drafts",
            action="store_true",
            help="Include WordPress draft properties.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Audit only the first N matching properties.",
        )

    def handle(self, *args, **options):
        xml_path = Path(options["xml_path"]).expanduser().resolve()

        if not xml_path.is_file():
            raise CommandError(f"XML file does not exist: {xml_path}")

        limit = options["limit"]
        if limit is not None and limit < 1:
            raise CommandError("--limit must be at least 1.")

        output_dir = Path(options["output_dir"]).expanduser().resolve()
        listings_dir = output_dir / "listings"

        output_dir.mkdir(parents=True, exist_ok=True)
        listings_dir.mkdir(parents=True, exist_ok=True)

        importer = EstateXmlImportCommand()

        self.stdout.write(f"Reading WordPress export: {xml_path}")

        channel = importer._parse_channel(xml_path)
        items = channel.findall("item")
        attachment_urls = importer._build_attachment_lookup(items)

        property_items = [
            item
            for item in items
            if importer._text(item, "wp:post_type") == "property"
        ]

        selected_items = []

        for item in property_items:
            status = importer._text(item, "wp:status") or "draft"

            if status != "publish" and not options["include_drafts"]:
                continue

            selected_items.append(item)

        if limit is not None:
            selected_items = selected_items[:limit]

        listing_rows: list[dict[str, Any]] = []
        warning_rows: list[dict[str, str]] = []

        section_frequency: Counter[str] = Counter()
        metadata_frequency: Counter[str] = Counter()
        taxonomy_frequency: Counter[str] = Counter()

        mapping_failures = 0

        for position, item in enumerate(selected_items, start=1):
            post_id = importer._text(item, "wp:post_id") or "unknown"

            try:
                mapped = importer._map_property(
                    item=item,
                    attachment_urls=attachment_urls,
                    listing_key_prefix="estate4u-wp-",
                )
            except Exception as exc:
                mapping_failures += 1
                warning_rows.append(
                    {
                        "post_id": post_id,
                        "title": importer._text(item, "title"),
                        "warning": f"XML mapping failed: {exc}",
                    }
                )
                continue

            defaults = mapped["defaults"]

            raw_html = defaults.get("property_description") or ""
            metadata = defaults.get("wp_meta_json") or {}
            terms = defaults.get("wp_terms_json") or {}

            parsed = parse_estate_content(
                raw_html,
                metadata,
                terms,
            )

            title = defaults.get("property_title") or f"Property {post_id}"
            slug = (
                defaults.get("property_slug")
                or slugify(title)
                or f"property-{post_id}"
            )

            for section in parsed.sections:
                section_frequency[section.heading or "Overview"] += 1

            for key in metadata:
                if key not in {
                    "gallery_image_urls",
                    "featured_image_url",
                }:
                    metadata_frequency[str(key)] += 1

            raw_taxonomies = terms.get("raw_taxonomies", {})
            if isinstance(raw_taxonomies, dict):
                for taxonomy_name, taxonomy_values in raw_taxonomies.items():
                    if taxonomy_values:
                        taxonomy_frequency[str(taxonomy_name)] += 1

            for warning in parsed.warnings:
                warning_rows.append(
                    {
                        "post_id": post_id,
                        "title": title,
                        "warning": warning,
                    }
                )

            gallery_urls = metadata.get("gallery_image_urls", [])
            if not isinstance(gallery_urls, list):
                gallery_urls = []

            listing_rows.append(
                {
                    "post_id": post_id,
                    "listing_key": mapped["listing_key"],
                    "title": title,
                    "slug": slug,
                    "publication_status": defaults.get("publish_status") or "",
                    "standard_status": defaults.get("standard_status") or "",
                    "developer": defaults.get("developer") or "",
                    "city": defaults.get("city") or "",
                    "province": defaults.get("state_or_province") or "",
                    "country": defaults.get("country") or "",
                    "occupancy_year": defaults.get("occupancy_year") or "",
                    "list_price": defaults.get("list_price") or "",
                    "featured_image_url": (
                        defaults.get("featured_image_url") or ""
                    ),
                    "image_count": len(gallery_urls),
                    "html_length": len(raw_html),
                    "section_count": len(parsed.sections),
                    "unit_type_count": len(parsed.unit_types),
                    "price_count": len(parsed.prices),
                    "deposit_plan_count": len(parsed.deposit_plans),
                    "incentive_count": len(parsed.incentives),
                    "amenity_count": len(parsed.amenities),
                    "document_count": len(parsed.documents),
                    "warning_count": len(parsed.warnings),
                    "audit_file": f"listings/{post_id}-{slug}.html",
                }
            )

            report_path = listings_dir / f"{post_id}-{slug}.html"

            self._write_listing_report(
                report_path=report_path,
                post_id=post_id,
                defaults=defaults,
                parsed=parsed,
            )

            if options["verbosity"] >= 2:
                self.stdout.write(
                    f"[{position}/{len(selected_items)}] "
                    f"{post_id} | {title} | "
                    f"warnings={len(parsed.warnings)}"
                )

        self._write_csv(
            output_dir / "listings.csv",
            listing_rows,
            fieldnames=[
                "post_id",
                "listing_key",
                "title",
                "slug",
                "publication_status",
                "standard_status",
                "developer",
                "city",
                "province",
                "country",
                "occupancy_year",
                "list_price",
                "featured_image_url",
                "image_count",
                "html_length",
                "section_count",
                "unit_type_count",
                "price_count",
                "deposit_plan_count",
                "incentive_count",
                "amenity_count",
                "document_count",
                "warning_count",
                "audit_file",
            ],
        )

        self._write_csv(
            output_dir / "warnings.csv",
            warning_rows,
            fieldnames=[
                "post_id",
                "title",
                "warning",
            ],
        )

        self._write_frequency_csv(
            output_dir / "section-frequency.csv",
            "section_heading",
            section_frequency,
        )

        self._write_frequency_csv(
            output_dir / "metadata-frequency.csv",
            "metadata_key",
            metadata_frequency,
        )

        self._write_frequency_csv(
            output_dir / "taxonomy-frequency.csv",
            "taxonomy",
            taxonomy_frequency,
        )

        self._write_index(
            output_dir=output_dir,
            listing_rows=listing_rows,
            source_xml=xml_path,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Audit completed. Listings={len(listing_rows)}, "
                f"mapping_failures={mapping_failures}, "
                f"warnings={len(warning_rows)}."
            )
        )

        self.stdout.write(f"Output directory: {output_dir}")

    def _write_listing_report(
        self,
        *,
        report_path: Path,
        post_id: str,
        defaults: dict[str, Any],
        parsed,
    ) -> None:
        title = str(defaults.get("property_title") or f"Property {post_id}")
        raw_html = str(defaults.get("property_description") or "")
        metadata = defaults.get("wp_meta_json") or {}
        terms = defaults.get("wp_terms_json") or {}
        post_data = defaults.get("wp_post_json") or {}

        sections_html = "".join(
            (
                "<article class='card'>"
                f"<h3>{html.escape(section.heading or 'Overview')}</h3>"
                f"<p><strong>Source key:</strong> "
                f"{html.escape(section.source_key)}</p>"
                f"<pre>{html.escape(section.html)}</pre>"
                "</article>"
            )
            for section in parsed.sections
        )

        unit_types_html = self._items_table(
            parsed.unit_types,
            ["text"],
        )

        prices_html = self._items_table(
            parsed.prices,
            ["text", "amount", "unit_type_key"],
        )

        incentives_html = self._items_table(
            parsed.incentives,
            ["text"],
        )

        amenities_html = self._items_table(
            parsed.amenities,
            ["text"],
        )

        documents_html = self._items_table(
            parsed.documents,
            ["text", "url"],
        )

        deposit_html_parts = []

        for plan in parsed.deposit_plans:
            deposit_html_parts.append(
                "<article class='card'>"
                f"<h3>{html.escape(plan.title)}</h3>"
                f"<p><strong>Source key:</strong> "
                f"{html.escape(plan.source_key)}</p>"
                f"{self._items_table(plan.installments, ['text', 'amount', 'percentage', 'milestone'])}"
                "</article>"
            )

        warnings_html = (
            "<ul>"
            + "".join(
                f"<li>{html.escape(str(warning))}</li>"
                for warning in parsed.warnings
            )
            + "</ul>"
            if parsed.warnings
            else "<p>No parser warnings.</p>"
        )

        iframe_source = html.escape(raw_html, quote=True)

        page = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{html.escape(title)} — Estate4U audit</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            background: #f4f5f7;
            color: #1f2937;
        }}

        main {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px;
        }}

        h1, h2, h3 {{
            color: #111827;
        }}

        .card {{
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
        }}

        th, td {{
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }}

        th {{
            background: #f3f4f6;
        }}

        pre {{
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            background: #111827;
            color: #f9fafb;
            padding: 16px;
            border-radius: 6px;
        }}

        iframe {{
            width: 100%;
            min-height: 600px;
            background: white;
            border: 1px solid #d1d5db;
        }}

        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }}

        .summary div {{
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
        }}
    </style>
</head>
<body>
<main>
    <h1>{html.escape(title)}</h1>

    <section class="summary">
        <div><strong>WordPress ID</strong><br>{html.escape(post_id)}</div>
        <div><strong>Status</strong><br>{html.escape(str(defaults.get("publish_status") or ""))}</div>
        <div><strong>City</strong><br>{html.escape(str(defaults.get("city") or ""))}</div>
        <div><strong>Developer</strong><br>{html.escape(str(defaults.get("developer") or ""))}</div>
        <div><strong>Warnings</strong><br>{len(parsed.warnings)}</div>
    </section>

    <h2>Original client HTML preview</h2>
    <section class="card">
        <iframe sandbox srcdoc="{iframe_source}"></iframe>
    </section>

    <h2>Original HTML source</h2>
    <section class="card">
        <pre>{html.escape(raw_html)}</pre>
    </section>

    <h2>Detected content sections</h2>
    {sections_html or "<p>No sections detected.</p>"}

    <h2>Detected unit types</h2>
    {unit_types_html}

    <h2>Detected prices</h2>
    {prices_html}

    <h2>Detected deposit plans</h2>
    {"".join(deposit_html_parts) or "<p>No deposit plans detected.</p>"}

    <h2>Detected incentives</h2>
    {incentives_html}

    <h2>Detected amenities</h2>
    {amenities_html}

    <h2>Detected documents</h2>
    {documents_html}

    <h2>Parser warnings</h2>
    <section class="card">
        {warnings_html}
    </section>

    <h2>WordPress metadata</h2>
    <section class="card">
        <pre>{html.escape(json.dumps(metadata, indent=2, default=str))}</pre>
    </section>

    <h2>WordPress taxonomies</h2>
    <section class="card">
        <pre>{html.escape(json.dumps(terms, indent=2, default=str))}</pre>
    </section>

    <h2>WordPress post data</h2>
    <section class="card">
        <pre>{html.escape(json.dumps(post_data, indent=2, default=str))}</pre>
    </section>
</main>
</body>
</html>
"""

        report_path.write_text(page, encoding="utf-8")

    def _items_table(self, items, attributes: list[str]) -> str:
        if not items:
            return "<p>None detected.</p>"

        headings = "".join(
            f"<th>{html.escape(attribute.replace('_', ' ').title())}</th>"
            for attribute in attributes
        )

        rows = []

        for item in items:
            cells = "".join(
                f"<td>{html.escape(str(getattr(item, attribute, '') or ''))}</td>"
                for attribute in attributes
            )
            rows.append(f"<tr>{cells}</tr>")

        return (
            "<section class='card'>"
            "<table>"
            f"<thead><tr>{headings}</tr></thead>"
            f"<tbody>{''.join(rows)}</tbody>"
            "</table>"
            "</section>"
        )

    def _write_csv(
        self,
        path: Path,
        rows: list[dict[str, Any]],
        *,
        fieldnames: list[str],
    ) -> None:
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames,
                extrasaction="ignore",
            )
            writer.writeheader()
            writer.writerows(rows)

    def _write_frequency_csv(
        self,
        path: Path,
        label_name: str,
        counter: Counter[str],
    ) -> None:
        rows = [
            {
                label_name: name,
                "listing_count": count,
            }
            for name, count in counter.most_common()
        ]

        self._write_csv(
            path,
            rows,
            fieldnames=[
                label_name,
                "listing_count",
            ],
        )

    def _write_index(
        self,
        *,
        output_dir: Path,
        listing_rows: list[dict[str, Any]],
        source_xml: Path,
    ) -> None:
        table_rows = []

        for row in listing_rows:
            report_link = html.escape(str(row["audit_file"]))

            table_rows.append(
                "<tr>"
                f"<td>{html.escape(str(row['post_id']))}</td>"
                f"<td><a href='{report_link}'>{html.escape(str(row['title']))}</a></td>"
                f"<td>{html.escape(str(row['city']))}</td>"
                f"<td>{html.escape(str(row['developer']))}</td>"
                f"<td>{row['section_count']}</td>"
                f"<td>{row['document_count']}</td>"
                f"<td>{row['warning_count']}</td>"
                "</tr>"
            )

        page = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Estate4U XML audit</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px;
            background: #f4f5f7;
            color: #1f2937;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
        }}

        th, td {{
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
        }}

        th {{
            background: #e5e7eb;
        }}

        a {{
            color: #1d4ed8;
        }}
    </style>
</head>
<body>
    <h1>Estate4U WordPress listing audit</h1>

    <p><strong>Source:</strong> {html.escape(str(source_xml))}</p>
    <p><strong>Listings:</strong> {len(listing_rows)}</p>

    <p>
        Supporting reports:
        <a href="listings.csv">listings.csv</a> |
        <a href="section-frequency.csv">section-frequency.csv</a> |
        <a href="metadata-frequency.csv">metadata-frequency.csv</a> |
        <a href="taxonomy-frequency.csv">taxonomy-frequency.csv</a> |
        <a href="warnings.csv">warnings.csv</a>
    </p>

    <table>
        <thead>
            <tr>
                <th>Post ID</th>
                <th>Listing</th>
                <th>City</th>
                <th>Developer</th>
                <th>Sections</th>
                <th>Documents</th>
                <th>Warnings</th>
            </tr>
        </thead>
        <tbody>
            {''.join(table_rows)}
        </tbody>
    </table>
</body>
</html>
"""

        (output_dir / "index.html").write_text(
            page,
            encoding="utf-8",
        )