from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from mls.models import (
    EstateAmenity, EstateContentSection, EstateDepositInstallment, EstateDepositPlan,
    EstateDocument, EstateIncentive, EstatePrice, EstateProject, EstateProperty,
    EstateSourceSnapshot, EstateUnitType,
)
from mls.services.estate_content import parse_estate_content


class Command(BaseCommand):
    help = "Idempotently import legacy WordPress estate rows into canonical estate projects."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--legacy-id", type=int)
        parser.add_argument("--limit", type=int)

    def handle(self, *args, **options):
        queryset = EstateProperty.objects.all().order_by("id")
        if options["legacy_id"]:
            queryset = queryset.filter(pk=options["legacy_id"])
        if options["limit"]:
            queryset = queryset[:options["limit"]]
        totals = {"created": 0, "updated": 0, "skipped": 0, "warnings": 0, "failed": 0}
        # Materialize before opening per-project transactions. A server-side
        # PostgreSQL cursor is invalidated by commits on the same connection.
        for legacy in list(queryset):
            try:
                with transaction.atomic():
                    result = self._import(legacy)
                    if result is None:
                        totals["skipped"] += 1
                        continue
                    created, warning_count = result
                    totals["created" if created else "updated"] += 1
                    totals["warnings"] += warning_count
                    if options["dry_run"]:
                        transaction.set_rollback(True)
            except Exception as exc:
                totals["failed"] += 1
                self.stderr.write(f"legacy {legacy.pk}: {exc}")
        self.stdout.write(" ".join(f"{key}={value}" for key, value in totals.items()))
        if options["legacy_id"] and not sum(totals.values()):
            raise CommandError("Legacy estate record not found.")

    def _import(self, legacy):
        source_id = str(legacy.listing_id or legacy.listing_key or legacy.pk)
        existing = EstateProject.objects.filter(source="wordpress", source_id=source_id).first()
        if existing:
            snapshot = EstateSourceSnapshot.objects.filter(project=existing).first()
            if snapshot and (
                snapshot.raw_html == (legacy.property_description or "")
                and snapshot.raw_metadata == (legacy.wp_meta_json or {})
                and snapshot.raw_terms == (legacy.wp_terms_json or {})
                and snapshot.raw_post == (legacy.wp_post_json or {})
                and snapshot.source_updated_at == legacy.modification_timestamp
            ):
                return None
        title = legacy.property_title or legacy.unparsed_address or f"Estate project {source_id}"
        desired_slug = slugify(legacy.property_slug or title)[:450] or f"estate-{legacy.pk}"
        slug = desired_slug
        if EstateProject.objects.exclude(source="wordpress", source_id=source_id).filter(slug=slug).exists():
            slug = f"{desired_slug[:430]}-{legacy.pk}"
        project, created = EstateProject.objects.update_or_create(
            source="wordpress", source_id=source_id,
            defaults={
                "source_updated_at": legacy.modification_timestamp, "title": title, "slug": slug,
                "publication_status": legacy.publish_status or "draft", "developer": legacy.developer or "",
                "occupancy_year": legacy.occupancy_year, "address": legacy.unparsed_address or "",
                "city": legacy.city or "", "province": legacy.state_or_province or "",
                "postal_code": legacy.postal_code or "", "country": legacy.country or "",
                "latitude": legacy.latitude, "longitude": legacy.longitude,
                "featured_image_url": legacy.featured_image_url or "", "is_featured": bool(legacy.is_featured),
            },
        )
        parsed = parse_estate_content(legacy.property_description or "", legacy.wp_meta_json, legacy.wp_terms_json)
        for relation in (project.sections, project.prices, project.deposit_plans, project.incentives, project.amenities, project.documents, project.unit_types):
            relation.all().delete()
        units = [EstateUnitType(project=project, name=x.text, display_order=i) for i, x in enumerate(parsed.unit_types)]
        EstateUnitType.objects.bulk_create(units)
        EstateContentSection.objects.bulk_create([EstateContentSection(project=project, heading=x.heading, html=x.html, display_order=i) for i, x in enumerate(parsed.sections)])
        EstatePrice.objects.bulk_create([EstatePrice(project=project, display_text=x.text, amount=x.amount, currency="CAD" if "$" in x.text else "", display_order=i) for i, x in enumerate(parsed.prices)])
        for i, item in enumerate(parsed.deposits):
            plan = EstateDepositPlan.objects.create(project=project, title="Deposit plan", display_order=i)
            EstateDepositInstallment.objects.create(plan=plan, milestone=item.milestone or item.text, amount_text=item.text, amount=item.amount, percentage=item.percentage)
        EstateIncentive.objects.bulk_create([EstateIncentive(project=project, description=x.text, display_order=i) for i, x in enumerate(parsed.incentives)])
        EstateAmenity.objects.bulk_create([EstateAmenity(project=project, description=x.text, display_order=i) for i, x in enumerate(parsed.amenities)])
        EstateDocument.objects.bulk_create([EstateDocument(project=project, label=x.text, document_type="floor_plan" if "floor" in x.text.lower() else "other", source_url=x.url, display_order=i) for i, x in enumerate(parsed.documents)])
        EstateSourceSnapshot.objects.update_or_create(project=project, defaults={"raw_html": legacy.property_description or "", "raw_metadata": legacy.wp_meta_json or {}, "raw_terms": legacy.wp_terms_json or {}, "raw_post": legacy.wp_post_json or {}, "warnings": parsed.warnings, "source_updated_at": legacy.modification_timestamp})
        return created, len(parsed.warnings)
