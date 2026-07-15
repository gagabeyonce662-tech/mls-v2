from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from mls.models import (
    EstateAmenity,
    EstateContentSection,
    EstateDepositInstallment,
    EstateDepositPlan,
    EstateDocument,
    EstateIncentive,
    EstatePrice,
    EstateProject,
    EstateProperty,
    EstateSourceSnapshot,
    EstateUnitType,
)
from mls.services.estate_content import parse_estate_content


PARSER_VERSION = 2


def _json_value(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


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
            queryset = queryset[: options["limit"]]
        legacy_rows = list(queryset)
        if options["legacy_id"] and not legacy_rows:
            raise CommandError("Legacy estate record not found.")

        totals = {"created": 0, "updated": 0, "skipped": 0, "warnings": 0, "failed": 0}
        for legacy in legacy_rows:
            try:
                with transaction.atomic():
                    result = self._import(legacy)
                    if result is None:
                        totals["skipped"] += 1
                    else:
                        created, warning_count = result
                        totals["created" if created else "updated"] += 1
                        totals["warnings"] += warning_count
                    if options["dry_run"]:
                        transaction.set_rollback(True)
            except Exception as exc:
                totals["failed"] += 1
                self.stderr.write(f"legacy {legacy.pk}: {exc}")
        self.stdout.write(" ".join(f"{key}={value}" for key, value in totals.items()))

    def _source_values(self, legacy, title, slug):
        return {
            "source_updated_at": legacy.modification_timestamp,
            "title": title,
            "slug": slug,
            "publication_status": legacy.publish_status or "draft",
            "developer": legacy.developer or "",
            "occupancy_year": legacy.occupancy_year,
            "address": legacy.unparsed_address or "",
            "city": legacy.city or "",
            "province": legacy.state_or_province or "",
            "postal_code": legacy.postal_code or "",
            "country": legacy.country or "",
            "latitude": legacy.latitude,
            "longitude": legacy.longitude,
            "featured_image_url": legacy.featured_image_url or "",
            "is_featured": bool(legacy.is_featured),
        }

    def _reconcile_project(self, project, snapshot, incoming, warnings):
        previous = snapshot.imported_project_values if snapshot else {}
        imported_values = {}
        changed_fields = []
        for field, incoming_value in incoming.items():
            current_value = getattr(project, field)
            current_json = _json_value(current_value)
            incoming_json = _json_value(incoming_value)
            if previous and field in previous:
                if current_json == previous[field]:
                    if current_value != incoming_value:
                        setattr(project, field, incoming_value)
                        changed_fields.append(field)
                    imported_values[field] = incoming_json
                else:
                    imported_values[field] = previous[field]
                    if current_json != incoming_json:
                        warnings.append(f"Preserved manually changed project field: {field}.")
            else:
                # Existing projects from parser v1 have no baseline. Preserve their
                # current values and establish the baseline without guessing.
                imported_values[field] = current_json
        if changed_fields:
            project.save(update_fields=[*changed_fields, "updated_at"])
        return imported_values

    def _upsert(self, model, parent_filter, source_key, defaults, legacy_match, adopt_legacy, warnings):
        existing = model.objects.filter(**parent_filter, source_key=source_key).first()
        if existing and not existing.parser_owned:
            warnings.append(f"Preserved manually maintained {model.__name__} with source key {source_key}.")
            return existing
        if not existing and adopt_legacy:
            legacy = model.objects.filter(
                **parent_filter,
                source_key="",
                parser_owned=False,
                **legacy_match,
            ).order_by("id").first()
            if legacy:
                legacy.source_key = source_key
                legacy.parser_owned = True
                legacy.save(update_fields=["source_key", "parser_owned"])
        obj, _ = model.objects.update_or_create(
            **parent_filter,
            source_key=source_key,
            defaults={**defaults, "parser_owned": True},
        )
        return obj

    @staticmethod
    def _delete_stale(model, parent_filter, active_keys):
        model.objects.filter(**parent_filter, parser_owned=True).exclude(source_key__in=active_keys).delete()

    def _reconcile_children(self, project, parsed, adopt_legacy, warnings):
        unit_objects = {}
        unit_keys = []
        for order, item in enumerate(parsed.unit_types):
            obj = self._upsert(
                EstateUnitType,
                {"project": project},
                item.source_key,
                {"name": item.text, "description": "", "display_order": order},
                {"name": item.text},
                adopt_legacy,
                warnings,
            )
            unit_objects[item.source_key] = obj
            unit_keys.append(item.source_key)

        section_keys = []
        for order, section in enumerate(parsed.sections):
            self._upsert(
                EstateContentSection,
                {"project": project},
                section.source_key,
                {"heading": section.heading, "html": section.html, "display_order": order},
                {"heading": section.heading, "html": section.html},
                adopt_legacy,
                warnings,
            )
            section_keys.append(section.source_key)

        price_keys = []
        for order, item in enumerate(parsed.prices):
            unit = unit_objects.get(item.unit_type_key)
            self._upsert(
                EstatePrice,
                {"project": project},
                item.source_key,
                {"unit_type": unit, "display_text": item.text, "amount": item.amount, "currency": "CAD" if "$" in item.text else "", "display_order": order},
                {"display_text": item.text},
                adopt_legacy,
                warnings,
            )
            price_keys.append(item.source_key)

        plan_keys = []
        for plan_order, parsed_plan in enumerate(parsed.deposit_plans):
            unit = unit_objects.get(parsed_plan.unit_type_key)
            plan = self._upsert(
                EstateDepositPlan,
                {"project": project},
                parsed_plan.source_key,
                {"unit_type": unit, "title": parsed_plan.title, "display_order": plan_order},
                {"title": parsed_plan.title},
                adopt_legacy,
                warnings,
            )
            plan_keys.append(parsed_plan.source_key)
            installment_keys = []
            for order, item in enumerate(parsed_plan.installments):
                self._upsert(
                    EstateDepositInstallment,
                    {"plan": plan},
                    item.source_key,
                    {"milestone": item.milestone or item.text, "amount_text": item.text, "amount": item.amount, "percentage": item.percentage, "display_order": order},
                    {"milestone": item.milestone or item.text, "amount_text": item.text},
                    adopt_legacy,
                    warnings,
                )
                installment_keys.append(item.source_key)
            self._delete_stale(EstateDepositInstallment, {"plan": plan}, installment_keys)

        incentive_keys = []
        for order, item in enumerate(parsed.incentives):
            self._upsert(EstateIncentive, {"project": project}, item.source_key, {"description": item.text, "display_order": order}, {"description": item.text}, adopt_legacy, warnings)
            incentive_keys.append(item.source_key)

        amenity_keys = []
        for order, item in enumerate(parsed.amenities):
            self._upsert(EstateAmenity, {"project": project}, item.source_key, {"description": item.text, "display_order": order}, {"description": item.text}, adopt_legacy, warnings)
            amenity_keys.append(item.source_key)

        document_keys = []
        for order, item in enumerate(parsed.documents):
            document_type = "floor_plan" if "floor" in item.text.lower() else "price_list" if "price" in item.text.lower() else "brochure" if "brochure" in item.text.lower() else "other"
            self._upsert(
                EstateDocument,
                {"project": project},
                item.source_key,
                {"label": item.text, "document_type": document_type, "source_url": item.url, "requires_phone_verification": True, "display_order": order},
                {"source_url": item.url},
                adopt_legacy,
                warnings,
            )
            document_keys.append(item.source_key)

        self._delete_stale(EstateContentSection, {"project": project}, section_keys)
        self._delete_stale(EstatePrice, {"project": project}, price_keys)
        self._delete_stale(EstateDepositPlan, {"project": project}, plan_keys)
        self._delete_stale(EstateIncentive, {"project": project}, incentive_keys)
        self._delete_stale(EstateAmenity, {"project": project}, amenity_keys)
        stale_documents = EstateDocument.objects.filter(project=project, parser_owned=True).exclude(source_key__in=document_keys)
        for document in stale_documents:
            if document.intents.exists():
                document.parser_owned = False
                document.source_key = ""
                document.save(update_fields=["parser_owned", "source_key"])
                warnings.append(f"Preserved stale document {document.id} because it has access intents.")
            else:
                document.delete()
        self._delete_stale(EstateUnitType, {"project": project}, unit_keys)

    def _import(self, legacy):
        source_id = str(legacy.listing_id or legacy.listing_key or legacy.pk)
        title = legacy.property_title or legacy.unparsed_address or f"Estate project {source_id}"
        desired_slug = slugify(legacy.property_slug or title)[:450] or f"estate-{legacy.pk}"
        existing = EstateProject.objects.filter(source="wordpress", source_id=source_id).first()
        slug = desired_slug
        if EstateProject.objects.exclude(source="wordpress", source_id=source_id).filter(slug=slug).exists():
            slug = f"{desired_slug[:430]}-{legacy.pk}"
        incoming = self._source_values(legacy, title, slug)
        snapshot = EstateSourceSnapshot.objects.filter(project=existing).first() if existing else None
        if snapshot and snapshot.parser_version == PARSER_VERSION and (
            snapshot.raw_html == (legacy.property_description or "")
            and snapshot.raw_metadata == (legacy.wp_meta_json or {})
            and snapshot.raw_terms == (legacy.wp_terms_json or {})
            and snapshot.raw_post == (legacy.wp_post_json or {})
            and snapshot.source_updated_at == legacy.modification_timestamp
        ):
            return None

        if existing:
            project, created = existing, False
        else:
            project = EstateProject.objects.create(source="wordpress", source_id=source_id, **incoming)
            created = True

        parsed = parse_estate_content(legacy.property_description or "", legacy.wp_meta_json, legacy.wp_terms_json)
        warnings = list(parsed.warnings)
        imported_values = {field: _json_value(value) for field, value in incoming.items()} if created else self._reconcile_project(project, snapshot, incoming, warnings)
        self._reconcile_children(project, parsed, bool(snapshot and snapshot.parser_version < PARSER_VERSION), warnings)
        EstateSourceSnapshot.objects.update_or_create(
            project=project,
            defaults={
                "raw_html": legacy.property_description or "",
                "raw_metadata": legacy.wp_meta_json or {},
                "raw_terms": legacy.wp_terms_json or {},
                "raw_post": legacy.wp_post_json or {},
                "warnings": warnings,
                "imported_project_values": imported_values,
                "parser_version": PARSER_VERSION,
                "source_updated_at": legacy.modification_timestamp,
            },
        )
        return created, len(warnings)
