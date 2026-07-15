from dataclasses import dataclass, field

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


class LegacyEstateNotFound(Exception):
    pass


@dataclass
class EstateImportRunResult:
    totals: dict = field(
        default_factory=lambda: {
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "warnings": 0,
            "failed": 0,
        }
    )
    failures: list[str] = field(default_factory=list)


def _json_value(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


class EstateProjectImporter:
    """Reconcile legacy WordPress estate rows into canonical projects."""

    def run(self, *, legacy_id=None, limit=None, dry_run=False):
        queryset = EstateProperty.objects.all().order_by("id")
        if legacy_id:
            queryset = queryset.filter(pk=legacy_id)
        if limit:
            queryset = queryset[:limit]

        legacy_rows = list(queryset)
        if legacy_id and not legacy_rows:
            raise LegacyEstateNotFound("Legacy estate record not found.")

        result = EstateImportRunResult()
        for legacy in legacy_rows:
            try:
                with transaction.atomic():
                    imported = self.import_legacy(legacy)
                    if imported is None:
                        result.totals["skipped"] += 1
                    else:
                        created, warning_count = imported
                        outcome = "created" if created else "updated"
                        result.totals[outcome] += 1
                        result.totals["warnings"] += warning_count
                    if dry_run:
                        transaction.set_rollback(True)
            except Exception as exc:
                result.totals["failed"] += 1
                result.failures.append(f"legacy {legacy.pk}: {exc}")
        return result

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

        for field_name, incoming_value in incoming.items():
            current_value = getattr(project, field_name)
            current_json = _json_value(current_value)
            incoming_json = _json_value(incoming_value)

            if previous and field_name in previous:
                if current_json == previous[field_name]:
                    if current_value != incoming_value:
                        setattr(project, field_name, incoming_value)
                        changed_fields.append(field_name)
                    imported_values[field_name] = incoming_json
                else:
                    imported_values[field_name] = previous[field_name]
                    if current_json != incoming_json:
                        warnings.append(
                            f"Preserved manually changed project field: {field_name}."
                        )
            else:
                # Parser-v1 projects have no import baseline. Preserve current values
                # and establish that baseline without guessing ownership.
                imported_values[field_name] = current_json

        if changed_fields:
            project.save(update_fields=[*changed_fields, "updated_at"])
        return imported_values

    def _upsert(
        self,
        model,
        parent_filter,
        source_key,
        defaults,
        legacy_match,
        adopt_legacy,
        warnings,
    ):
        existing = model.objects.filter(
            **parent_filter,
            source_key=source_key,
        ).first()
        if existing and not existing.parser_owned:
            warnings.append(
                f"Preserved manually maintained {model.__name__} "
                f"with source key {source_key}."
            )
            return existing

        if not existing and adopt_legacy:
            legacy = (
                model.objects.filter(
                    **parent_filter,
                    source_key="",
                    parser_owned=False,
                    **legacy_match,
                )
                .order_by("id")
                .first()
            )
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
        model.objects.filter(
            **parent_filter,
            parser_owned=True,
        ).exclude(source_key__in=active_keys).delete()

    def _reconcile_children(self, project, parsed, adopt_legacy, warnings):
        unit_objects = {}
        unit_keys = []
        for order, item in enumerate(parsed.unit_types):
            obj = self._upsert(
                EstateUnitType,
                {"project": project},
                item.source_key,
                {
                    "name": item.text,
                    "description": "",
                    "display_order": order,
                },
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
                {
                    "heading": section.heading,
                    "html": section.html,
                    "display_order": order,
                },
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
                {
                    "unit_type": unit,
                    "display_text": item.text,
                    "amount": item.amount,
                    "currency": "CAD" if "$" in item.text else "",
                    "display_order": order,
                },
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
                {
                    "unit_type": unit,
                    "title": parsed_plan.title,
                    "display_order": plan_order,
                },
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
                    {
                        "milestone": item.milestone or item.text,
                        "amount_text": item.text,
                        "amount": item.amount,
                        "percentage": item.percentage,
                        "display_order": order,
                    },
                    {
                        "milestone": item.milestone or item.text,
                        "amount_text": item.text,
                    },
                    adopt_legacy,
                    warnings,
                )
                installment_keys.append(item.source_key)
            self._delete_stale(
                EstateDepositInstallment,
                {"plan": plan},
                installment_keys,
            )

        incentive_keys = []
        for order, item in enumerate(parsed.incentives):
            self._upsert(
                EstateIncentive,
                {"project": project},
                item.source_key,
                {"description": item.text, "display_order": order},
                {"description": item.text},
                adopt_legacy,
                warnings,
            )
            incentive_keys.append(item.source_key)

        amenity_keys = []
        for order, item in enumerate(parsed.amenities):
            self._upsert(
                EstateAmenity,
                {"project": project},
                item.source_key,
                {"description": item.text, "display_order": order},
                {"description": item.text},
                adopt_legacy,
                warnings,
            )
            amenity_keys.append(item.source_key)

        document_keys = []
        for order, item in enumerate(parsed.documents):
            label = item.text.lower()
            if "floor" in label:
                document_type = "floor_plan"
            elif "price" in label:
                document_type = "price_list"
            elif "brochure" in label:
                document_type = "brochure"
            else:
                document_type = "other"

            self._upsert(
                EstateDocument,
                {"project": project},
                item.source_key,
                {
                    "label": item.text,
                    "document_type": document_type,
                    "source_url": item.url,
                    "requires_phone_verification": True,
                    "display_order": order,
                },
                {"source_url": item.url},
                adopt_legacy,
                warnings,
            )
            document_keys.append(item.source_key)

        self._delete_stale(
            EstateContentSection,
            {"project": project},
            section_keys,
        )
        self._delete_stale(EstatePrice, {"project": project}, price_keys)
        self._delete_stale(
            EstateDepositPlan,
            {"project": project},
            plan_keys,
        )
        self._delete_stale(
            EstateIncentive,
            {"project": project},
            incentive_keys,
        )
        self._delete_stale(
            EstateAmenity,
            {"project": project},
            amenity_keys,
        )

        stale_documents = EstateDocument.objects.filter(
            project=project,
            parser_owned=True,
        ).exclude(source_key__in=document_keys)
        for document in stale_documents:
            if document.intents.exists():
                document.parser_owned = False
                document.source_key = ""
                document.save(update_fields=["parser_owned", "source_key"])
                warnings.append(
                    f"Preserved stale document {document.id} because it has "
                    "access intents."
                )
            else:
                document.delete()

        self._delete_stale(EstateUnitType, {"project": project}, unit_keys)

    def import_legacy(self, legacy):
        source_id = str(legacy.listing_id or legacy.listing_key or legacy.pk)
        title = (
            legacy.property_title
            or legacy.unparsed_address
            or f"Estate project {source_id}"
        )
        desired_slug = (
            slugify(legacy.property_slug or title)[:450]
            or f"estate-{legacy.pk}"
        )
        existing = EstateProject.objects.filter(
            source="wordpress",
            source_id=source_id,
        ).first()
        slug = desired_slug
        slug_conflict = EstateProject.objects.exclude(
            source="wordpress",
            source_id=source_id,
        ).filter(slug=slug)
        if slug_conflict.exists():
            slug = f"{desired_slug[:430]}-{legacy.pk}"

        incoming = self._source_values(legacy, title, slug)
        snapshot = (
            EstateSourceSnapshot.objects.filter(project=existing).first()
            if existing
            else None
        )
        if snapshot and snapshot.parser_version == PARSER_VERSION:
            source_unchanged = (
                snapshot.raw_html == (legacy.property_description or "")
                and snapshot.raw_metadata == (legacy.wp_meta_json or {})
                and snapshot.raw_terms == (legacy.wp_terms_json or {})
                and snapshot.raw_post == (legacy.wp_post_json or {})
                and snapshot.source_updated_at == legacy.modification_timestamp
            )
            if source_unchanged:
                return None

        if existing:
            project = existing
            created = False
        else:
            project = EstateProject.objects.create(
                source="wordpress",
                source_id=source_id,
                **incoming,
            )
            created = True

        parsed = parse_estate_content(
            legacy.property_description or "",
            legacy.wp_meta_json,
            legacy.wp_terms_json,
        )
        warnings = list(parsed.warnings)
        if created:
            imported_values = {
                field_name: _json_value(value)
                for field_name, value in incoming.items()
            }
        else:
            imported_values = self._reconcile_project(
                project,
                snapshot,
                incoming,
                warnings,
            )

        adopt_legacy = bool(
            snapshot and snapshot.parser_version < PARSER_VERSION
        )
        self._reconcile_children(project, parsed, adopt_legacy, warnings)
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
