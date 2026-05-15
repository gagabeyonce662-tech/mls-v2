import json
import logging
import os
from uuid import uuid4

from cloudinary.exceptions import Error as CloudinaryError
from django.core.files.storage import default_storage
from django.utils import timezone
from django.db import DataError, DatabaseError, IntegrityError
from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EstateProperty
from .serializers import EstatePropertyWriteSerializer

logger = logging.getLogger(__name__)


class EstatePropertyAPIViewMixin:
    permission_classes = [AllowAny]
    table_name = "mls_estateproperty"
    wp_meta_column = "wp_meta_json"
    wp_terms_column = "wp_terms_json"
    wp_post_column = "wp_post_json"
    description_sections_column = "description_sections_json"
    custom_detail_blocks_column = "custom_detail_blocks_json"
    detail_blocks_layout_column = "detail_blocks_layout_json"

    
class EstatePropertyAPIViewMixinMethods(EstatePropertyAPIViewMixin):
    # WordPress/Houzez keys that should map to first-class estate columns.
    table_name = "mls_estateproperty"
    wp_meta_column = "wp_meta_json"
    wp_terms_column = "wp_terms_json"
    wp_post_column = "wp_post_json"
    description_sections_column = "description_sections_json"
    custom_detail_blocks_column = "custom_detail_blocks_json"
    detail_blocks_layout_column = "detail_blocks_layout_json"

    # WordPress/Houzez keys that should map to first-class estate columns.
    WP_TO_CORE_FIELD_MAP = {
        "post_title": "property_title",
        "title": "property_title",
        "post_name": "property_slug",
        "slug": "property_slug",
        "post_status": "publish_status",
        "status": "publish_status",
        "post_content": "property_description",
        "description": "property_description",
        "featured_image": "featured_image_url",
        "featured_image_url": "featured_image_url",
        "property_expiration_date": "expires_at",
        "expiry_date": "expires_at",
        "permalink": "listing_url",
        "sale_or_rent_price": "list_price",
        "second_price": "second_price",
        "fave_property_sec_price": "second_price",
        "enable_price_placeholder": "enable_price_placeholder",
        "price_placeholder": "price_placeholder",
        "price_prefix": "price_prefix",
        "after_price": "after_price",
        "size_postfix": "size_postfix",
        "land_area": "land_area",
        "land_area_size_postfix": "land_area_size_postfix",
        "rooms": "rooms",
        "garages": "garages",
        "garage_size": "garage_size",
        "property_id": "property_id_code",
        "max_bedrooms": "max_bedrooms",
        "developer": "developer",
        "occupancy": "occupancy_year",
        "signing_amount": "signing_amount",
        "lot_size": "lot_size",
        "kitchens": "kitchens",
        "fave_property_price": "list_price",
        "fave_property_bedrooms": "bedrooms_total",
        "fave_property_bathrooms": "bathrooms_total_integer",
        "fave_property_size": "building_area_total",
        "fave_property_size_prefix": "price_prefix",
        "fave_property_size_postfix": "size_postfix",
        "fave_property_land": "land_area",
        "fave_property_land_postfix": "land_area_size_postfix",
        "fave_property_rooms": "rooms",
        "fave_property_garage": "garages",
        "fave_property_garage_size": "garage_size",
        "fave_property_id": "property_id_code",
        "fave_property_max_bedrooms": "max_bedrooms",
        "fave_property_developer": "developer",
        "fave_property_occupancy": "occupancy_year",
        "fave_signing_amount": "signing_amount",
        "fave_property_lot_size": "lot_size",
        "fave_property_kitchens": "kitchens",
        "fave_property_address": "unparsed_address",
        "fave_property_map_address": "unparsed_address",
        "fave_property_zip": "postal_code",
        "fave_property_state": "state_or_province",
        "fave_property_city": "city",
        "houzez_geolocation_lat": "latitude",
        "houzez_geolocation_long": "longitude",
        "fave_mls-id": "listing_id",
        "fave_featured": "is_featured",
        "fave_exterior": "exterior_features",
        "fave_basement": "basement",
        "fave_taxes": "tax_annual_amount",
        "fave_tax-year": "tax_year",
        "fave_video_url": "listing_url",
    }

    TAXONOMY_KEYS = {
        "type",
        "status",
        "features",
        "labels",
        "city",
        "state",
        "country",
        "property_type",
        "property_status",
        "property_features",
        "property_label",
        "property_city",
    }
    TAXONOMY_KEY_ALIASES = {
        "property_type": "type",
        "property_status": "status",
        "property_features": "features",
        "property_label": "labels",
        "property_city": "city",
    }
    INTEGER_FIELDS = {
        "rooms",
        "garages",
        "max_bedrooms",
        "occupancy_year",
        "kitchens",
        "year_built",
        "tax_year",
    }
    NUMERIC_FIELDS = {
        "list_price",
        "second_price",
        "land_area",
        "signing_amount",
        "tax_annual_amount",
        "building_area_total",
    }
    BOOLEAN_FIELDS = {"enable_price_placeholder", "is_featured"}
    DESCRIPTION_SECTION_MAX_COUNT = 25
    DESCRIPTION_TITLE_MAX_LEN = 255
    DETAIL_BLOCK_MAX_COUNT = 50
    DETAIL_BLOCK_ITEM_MAX_COUNT = 100
    DETAIL_BLOCK_TEXT_MAX_LEN = 2000
    MAX_MEDIA_UPLOAD_FILES = 30
    MAX_MEDIA_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024

    def get_permissions(self):
        if self.request and self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    @classmethod
    def _db_data_type(cls, field):
        internal = field.get_internal_type()
        if internal in {"CharField", "SlugField", "URLField"}:
            return "character varying"
        if internal in {"TextField"}:
            return "text"
        if internal in {"BooleanField", "NullBooleanField"}:
            return "boolean"
        if internal in {"JSONField"}:
            return "jsonb"
        if internal in {"DateTimeField"}:
            return "timestamp with time zone"
        if internal in {"DateField"}:
            return "date"
        if internal in {"DecimalField"}:
            return "numeric"
        if internal in {"IntegerField", "PositiveIntegerField", "PositiveSmallIntegerField"}:
            return "integer"
        if internal in {"BigIntegerField", "BigAutoField"}:
            return "bigint"
        if internal in {"AutoField"}:
            return "integer"
        return internal.lower()

    @classmethod
    def _columns(cls):
        cols = []
        for field in EstateProperty._meta.concrete_fields:
            if not field.has_default():
                default_value = None
            else:
                default = field.default
                if callable(default):
                    default_value = None
                elif default is None:
                    default_value = None
                else:
                    default_value = default
            if default_value is None:
                default_value = None
            cols.append(
                {
                    "column_name": field.column,
                    "data_type": cls._db_data_type(field),
                    "is_nullable": "YES" if field.null else "NO",
                    "column_default": default_value,
                }
            )
        return cols

    @classmethod
    def _column_names(cls):
        return [f.column for f in EstateProperty._meta.concrete_fields]

    @classmethod
    def _normalize_taxonomy_key(cls, key):
        base_key = key[len("taxonomy_"):] if key.startswith("taxonomy_") else key
        return cls.TAXONOMY_KEY_ALIASES.get(base_key, base_key)

    @staticmethod
    def _to_string_array(value):
        if value is None:
            return []
        if isinstance(value, (list, tuple, set)):
            out = []
            for item in value:
                text = str(item).strip()
                if text:
                    out.append(text)
            # Preserve order but dedupe.
            return list(dict.fromkeys(out))
        text = str(value).strip()
        return [text] if text else []

    @staticmethod
    def _parse_json_object(value):
        if isinstance(value, dict):
            return dict(value)
        if not isinstance(value, str):
            return {}
        text = value.strip()
        if not text:
            return {}
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {}
        return {}

    @staticmethod
    def _looks_like_http_url(value):
        text = str(value or "").strip()
        return text.startswith("http://") or text.startswith("https://")

    @classmethod
    def _normalize_image_urls(cls, value):
        if value is None:
            return []
        raw_items = []
        if isinstance(value, (list, tuple, set)):
            raw_items.extend(list(value))
        elif isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("[") and text.endswith("]"):
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, list):
                        raw_items.extend(parsed)
                    else:
                        raw_items.append(text)
                except Exception:
                    raw_items.append(text)
            else:
                raw_items.extend([chunk.strip() for chunk in text.split(",")])
        else:
            raw_items.append(value)

        deduped = []
        seen = set()
        for item in raw_items:
            url = str(item or "").strip()
            if not url or not cls._looks_like_http_url(url):
                continue
            if url in seen:
                continue
            seen.add(url)
            deduped.append(url)
        return deduped

    @classmethod
    def _extract_gallery_urls_from_payload(cls, payload):
        if not isinstance(payload, dict):
            return [], False

        provided = False
        candidate_urls = []

        for key in ("image_urls", "images", "gallery_image_urls"):
            if key in payload:
                provided = True
                candidate_urls.extend(cls._normalize_image_urls(payload.get(key)))

        wp_post = cls._parse_json_object(payload.get("wp_post_json"))
        if "images" in wp_post:
            provided = True
            candidate_urls.extend(cls._normalize_image_urls(wp_post.get("images")))
        if "gallery" in wp_post:
            provided = True
            candidate_urls.extend(cls._normalize_image_urls(wp_post.get("gallery")))

        wp_meta = cls._parse_json_object(payload.get("wp_meta_json"))
        if "gallery_image_urls" in wp_meta:
            provided = True
            candidate_urls.extend(
                cls._normalize_image_urls(wp_meta.get("gallery_image_urls"))
            )

        return cls._normalize_image_urls(candidate_urls), provided

    @classmethod
    def _apply_gallery_urls(cls, mapped_payload, gallery_urls):
        urls = cls._normalize_image_urls(gallery_urls)
        wp_post = mapped_payload.get(cls.wp_post_column)
        if not isinstance(wp_post, dict):
            wp_post = {}
        wp_meta = mapped_payload.get(cls.wp_meta_column)
        if not isinstance(wp_meta, dict):
            wp_meta = {}

        wp_post = {**wp_post, "images": urls, "gallery": urls}
        wp_meta = {**wp_meta, "gallery_image_urls": urls}

        mapped_payload[cls.wp_post_column] = wp_post
        mapped_payload[cls.wp_meta_column] = wp_meta
        mapped_payload["featured_image_url"] = urls[0] if urls else ""
        return mapped_payload

    @classmethod
    def _merge_taxonomy_terms(cls, existing_terms, incoming_terms):
        merged = dict(existing_terms) if isinstance(existing_terms, dict) else {}
        for key, value in incoming_terms.items():
            normalized_key = cls._normalize_taxonomy_key(key)
            merged[normalized_key] = cls._to_string_array(value)
        return merged

    @classmethod
    def _normalize_mapped_value(cls, field_name, value):
        if value is None:
            return None
        if field_name in cls.BOOLEAN_FIELDS:
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                lowered = value.strip().lower()
                if lowered in {"1", "true", "yes", "y", "on"}:
                    return True
                if lowered in {"0", "false", "no", "n", "off"}:
                    return False
            return bool(value)
        if field_name in cls.INTEGER_FIELDS:
            if value == "":
                return None
            try:
                return int(value)
            except (TypeError, ValueError):
                return value
        if field_name in cls.NUMERIC_FIELDS:
            if value == "":
                return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return value
        return value

    @classmethod
    def _normalize_description_sections(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValidationError(
                {
                    "detail": "Invalid description_sections_json payload.",
                    "fields": {
                        cls.description_sections_column: "Expected an array of section objects."
                    },
                }
            )
        if len(value) > cls.DESCRIPTION_SECTION_MAX_COUNT:
            raise ValidationError(
                {
                    "detail": "Too many description sections.",
                    "fields": {
                        cls.description_sections_column: (
                            f"Maximum {cls.DESCRIPTION_SECTION_MAX_COUNT} sections are allowed."
                        )
                    },
                }
            )

        normalized = []
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise ValidationError(
                    {
                        "detail": "Invalid description section item.",
                        "fields": {
                            f"{cls.description_sections_column}[{idx}]": "Expected an object."
                        },
                    }
                )
            section_id = str(item.get("id") or f"section-{idx + 1}").strip()
            title = str(item.get("title") or "").strip()
            body_html = str(item.get("body_html") or "").strip()
            order = item.get("order", idx)
            try:
                order = int(order)
            except (TypeError, ValueError):
                order = idx

            if len(title) > cls.DESCRIPTION_TITLE_MAX_LEN:
                raise ValidationError(
                    {
                        "detail": "Description section title is too long.",
                        "fields": {
                            f"{cls.description_sections_column}[{idx}].title": (
                                f"Must be <= {cls.DESCRIPTION_TITLE_MAX_LEN} characters."
                            )
                        },
                    }
                )

            normalized.append(
                {
                    "id": section_id,
                    "title": title,
                    "body_html": body_html,
                    "order": order,
                }
            )
        return normalized

    @classmethod
    def _normalize_custom_detail_blocks(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValidationError(
                {
                    "detail": "Invalid custom_detail_blocks_json payload.",
                    "fields": {
                        cls.custom_detail_blocks_column: "Expected an array of block objects."
                    },
                }
            )
        if len(value) > cls.DETAIL_BLOCK_MAX_COUNT:
            raise ValidationError(
                {
                    "detail": "Too many custom detail blocks.",
                    "fields": {
                        cls.custom_detail_blocks_column: (
                            f"Maximum {cls.DETAIL_BLOCK_MAX_COUNT} blocks are allowed."
                        )
                    },
                }
            )

        normalized = []
        for idx, block in enumerate(value):
            if not isinstance(block, dict):
                raise ValidationError(
                    {
                        "detail": "Invalid custom detail block item.",
                        "fields": {
                            f"{cls.custom_detail_blocks_column}[{idx}]": "Expected an object."
                        },
                    }
                )

            block_id = str(block.get("id") or f"custom-detail-block-{idx + 1}").strip()
            title = str(block.get("title") or "").strip()
            items = block.get("items") or []
            if not isinstance(items, list):
                raise ValidationError(
                    {
                        "detail": "Invalid custom detail block rows.",
                        "fields": {
                            f"{cls.custom_detail_blocks_column}[{idx}].items": (
                                "Expected an array of label/value row objects."
                            )
                        },
                    }
                )
            if len(items) > cls.DETAIL_BLOCK_ITEM_MAX_COUNT:
                raise ValidationError(
                    {
                        "detail": "Too many custom detail block rows.",
                        "fields": {
                            f"{cls.custom_detail_blocks_column}[{idx}].items": (
                                f"Maximum {cls.DETAIL_BLOCK_ITEM_MAX_COUNT} rows are allowed."
                            )
                        },
                    }
                )

            try:
                order = int(block.get("order", idx))
            except (TypeError, ValueError):
                order = idx

            normalized_items = []
            for row_idx, row in enumerate(items):
                if not isinstance(row, dict):
                    raise ValidationError(
                        {
                            "detail": "Invalid custom detail block row.",
                            "fields": {
                                f"{cls.custom_detail_blocks_column}[{idx}].items[{row_idx}]": (
                                    "Expected an object."
                                )
                            },
                        }
                    )
                label = str(row.get("label") or "").strip()
                row_value = str(row.get("value") or "").strip()
                if not label and not row_value:
                    continue
                if (
                    len(label) > cls.DESCRIPTION_TITLE_MAX_LEN
                    or len(row_value) > cls.DETAIL_BLOCK_TEXT_MAX_LEN
                ):
                    raise ValidationError(
                        {
                            "detail": "Custom detail block row text is too long.",
                            "fields": {
                                f"{cls.custom_detail_blocks_column}[{idx}].items[{row_idx}]": (
                                    "Label or value exceeds the allowed length."
                                )
                            },
                        }
                    )
                normalized_items.append({"label": label, "value": row_value})

            if not title and not normalized_items:
                continue
            if len(title) > cls.DESCRIPTION_TITLE_MAX_LEN:
                raise ValidationError(
                    {
                        "detail": "Custom detail block title is too long.",
                        "fields": {
                            f"{cls.custom_detail_blocks_column}[{idx}].title": (
                                f"Must be <= {cls.DESCRIPTION_TITLE_MAX_LEN} characters."
                            )
                        },
                    }
                )
            normalized.append(
                {
                    "id": block_id,
                    "title": title,
                    "order": order,
                    "items": normalized_items,
                }
            )
        return normalized

    @classmethod
    def _normalize_detail_blocks_layout(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValidationError(
                {
                    "detail": "Invalid detail_blocks_layout_json payload.",
                    "fields": {
                        cls.detail_blocks_layout_column: "Expected an array of layout objects."
                    },
                }
            )
        if len(value) > cls.DETAIL_BLOCK_MAX_COUNT + 8:
            raise ValidationError(
                {
                    "detail": "Too many detail block layout entries.",
                    "fields": {
                        cls.detail_blocks_layout_column: "Layout contains too many entries."
                    },
                }
            )

        normalized = []
        seen = set()
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise ValidationError(
                    {
                        "detail": "Invalid detail block layout item.",
                        "fields": {
                            f"{cls.detail_blocks_layout_column}[{idx}]": "Expected an object."
                        },
                    }
                )
            block_id = str(item.get("id") or "").strip()
            if not block_id or block_id in seen:
                continue
            seen.add(block_id)
            kind = "custom" if item.get("kind") == "custom" else "default"
            try:
                order = int(item.get("order", idx))
            except (TypeError, ValueError):
                order = idx
            visible = item.get("visible", True)
            if isinstance(visible, str):
                visible = visible.strip().lower() not in {"0", "false", "no", "n", "off"}
            else:
                visible = bool(visible)
            normalized.append(
                {
                    "id": block_id,
                    "kind": kind,
                    "order": order,
                    "visible": visible,
                }
            )
        return normalized

    def _split_payload(self, payload):
        """
        Returns:
        - normalized payload mapped to estate table columns
        - unmapped wp/houzez metadata (preserved losslessly)
        """
        allowed = set(self._column_names())
        mapped = {}
        wp_meta = {}
        wp_terms = {}
        wp_post = {}
        json_columns = {
            self.wp_meta_column,
            self.wp_terms_column,
            self.wp_post_column,
            self.description_sections_column,
            self.custom_detail_blocks_column,
            self.detail_blocks_layout_column,
        }

        for key, value in payload.items():
            target_key = self.WP_TO_CORE_FIELD_MAP.get(key, key)
            if target_key in allowed and target_key != "id":
                mapped[target_key] = self._normalize_mapped_value(target_key, value)
            elif key.startswith("post_"):
                wp_post[key] = value
            elif key.startswith("taxonomy_") or key in self.TAXONOMY_KEYS:
                wp_terms[key] = value
            elif key.startswith("fave_") or key.startswith("_yoast_") or key.startswith("_elementor_") or key.startswith("wp_") or key.startswith("_wp_") or key.startswith("houzez_"):
                wp_meta[key] = value

        if self.wp_meta_column in allowed and wp_meta:
            existing_meta = mapped.get(self.wp_meta_column)
            if isinstance(existing_meta, dict):
                merged = {**existing_meta, **wp_meta}
            else:
                merged = wp_meta
            mapped[self.wp_meta_column] = merged

        if self.wp_terms_column in allowed and wp_terms:
            existing_terms = mapped.get(self.wp_terms_column)
            merged = self._merge_taxonomy_terms(existing_terms, wp_terms)
            mapped[self.wp_terms_column] = merged

        if self.wp_post_column in allowed and wp_post:
            existing_post = mapped.get(self.wp_post_column)
            if isinstance(existing_post, dict):
                merged = {**existing_post, **wp_post}
            else:
                merged = wp_post
            mapped[self.wp_post_column] = merged

        if self.description_sections_column in allowed:
            if self.description_sections_column in mapped:
                sections = self._normalize_description_sections(
                    mapped[self.description_sections_column]
                )
                mapped[self.description_sections_column] = sections
                if "property_description" in allowed:
                    mapped["property_description"] = (
                        sections[0]["body_html"] if sections else ""
                    )
            elif "property_description" in mapped:
                legacy_description = str(mapped.get("property_description") or "").strip()
                mapped[self.description_sections_column] = (
                    [
                        {
                            "id": "legacy-overview",
                            "title": "Overview",
                            "body_html": legacy_description,
                            "order": 0,
                        }
                    ]
                    if legacy_description
                    else []
                )

        if self.custom_detail_blocks_column in allowed and self.custom_detail_blocks_column in mapped:
            mapped[self.custom_detail_blocks_column] = self._normalize_custom_detail_blocks(
                mapped[self.custom_detail_blocks_column]
            )

        if self.detail_blocks_layout_column in allowed and self.detail_blocks_layout_column in mapped:
            mapped[self.detail_blocks_layout_column] = self._normalize_detail_blocks_layout(
                mapped[self.detail_blocks_layout_column]
            )

        invalid = {}
        for key, value in mapped.items():
            if key in json_columns:
                continue
            if isinstance(value, (list, tuple, set, dict)):
                invalid[key] = "Expected a scalar value."
        if invalid:
            raise ValidationError(
                {
                    "detail": "Invalid payload field types.",
                    "fields": invalid,
                }
            )

        return mapped

    def _prepare_sql_payload(self, payload):
        """
        Prepare normalized payload for ORM write.
        Keep JSON columns as Python dict/list; coerce sets/tuples to lists.
        """
        json_columns = {
            self.wp_meta_column,
            self.wp_terms_column,
            self.wp_post_column,
            self.description_sections_column,
            self.custom_detail_blocks_column,
            self.detail_blocks_layout_column,
        }
        prepared = {}
        for key, value in payload.items():
            if key in json_columns and isinstance(value, (dict, list, tuple, set)):
                if isinstance(value, set):
                    prepared[key] = list(value)
                elif isinstance(value, tuple):
                    prepared[key] = list(value)
                else:
                    prepared[key] = value
            else:
                prepared[key] = value
        return prepared

    def schema(self, request):
        return Response({"table": self.table_name, "columns": self._columns()})

    def list(self, request):
        page = max(int(request.query_params.get("page", 1)), 1)
        page_size = min(max(int(request.query_params.get("page_size", 20)), 1), 100)
        offset = (page - 1) * page_size

        search = (request.query_params.get("search") or "").strip()
        city = (request.query_params.get("city") or "").strip()
        status_value = (request.query_params.get("standard_status") or "").strip()
        publish_status = (request.query_params.get("publish_status") or "").strip()
        expires_from = (request.query_params.get("expires_from") or "").strip()
        expires_to = (request.query_params.get("expires_to") or "").strip()
        ordering = request.query_params.get("ordering") or "-modification_timestamp"

        allowed_order = {
            "id",
            "property_title",
            "list_price",
            "city",
            "standard_status",
            "publish_status",
            "modification_timestamp",
        }
        order_key = ordering.lstrip("-")
        if order_key not in allowed_order:
            order_key = "modification_timestamp"
        order_expr = f"-{order_key}" if ordering.startswith("-") else order_key

        queryset = EstateProperty.objects.all()

        if search:
            queryset = queryset.filter(
                Q(unparsed_address__icontains=search)
                | Q(listing_key__icontains=search)
                | Q(city__icontains=search)
                | Q(property_title__icontains=search)
                | Q(property_description__icontains=search)
                | Q(property_slug__icontains=search)
            )
        if city:
            queryset = queryset.filter(city__icontains=city)
        if status_value:
            queryset = queryset.filter(standard_status=status_value)
        if publish_status:
            queryset = queryset.filter(publish_status=publish_status)
        if expires_from:
            queryset = queryset.filter(expires_at__gte=expires_from)
        if expires_to:
            queryset = queryset.filter(expires_at__lte=expires_to)

        total = queryset.count()
        rows = list(
            queryset.order_by(order_expr)[offset : offset + page_size].values(
                *self._column_names()
            )
        )

        return Response({"count": total, "page": page, "page_size": page_size, "results": rows})

    def retrieve(self, request, pk=None):
        row = EstateProperty.objects.filter(id=pk).values(*self._column_names()).first()
        if not row:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(row)

    def create(self, request):
        serializer = EstatePropertyWriteSerializer(data={"payload": request.data})
        serializer.is_valid(raise_exception=True)
        raw_payload = dict(serializer.validated_data["payload"])
        logger.warning(
            "[estate:create] request payload keys=%s",
            sorted(raw_payload.keys()),
        )
        gallery_urls, gallery_provided = self._extract_gallery_urls_from_payload(
            raw_payload
        )

        payload = self._split_payload(raw_payload)
        if gallery_provided:
            payload = self._apply_gallery_urls(payload, gallery_urls)
        payload = self._prepare_sql_payload(payload)
        logger.warning(
            "[estate:create] normalized payload keys=%s gallery_count=%s",
            sorted(payload.keys()),
            len(gallery_urls),
        )
        payload.setdefault("is_featured", False)
        if not payload.get("listing_key"):
            return Response(
                {"listing_key": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            created = EstateProperty.objects.create(**payload)
        except (DataError, IntegrityError, DatabaseError, TypeError, ValueError) as exc:
            logger.exception("[estate:create] failed")
            raise ValidationError(
                {"detail": "Invalid payload for estate property create.", "error": str(exc)}
            ) from exc
        return self.retrieve(request, pk=created.id)

    def update(self, request, pk=None):
        return self._update_internal(request, pk)

    def partial_update(self, request, pk=None):
        return self._update_internal(request, pk)

    def _update_internal(self, request, pk):
        serializer = EstatePropertyWriteSerializer(data={"payload": request.data})
        serializer.is_valid(raise_exception=True)
        raw_payload = dict(serializer.validated_data["payload"])
        logger.warning(
            "[estate:update] pk=%s request payload keys=%s",
            pk,
            sorted(raw_payload.keys()),
        )
        try:
            gallery_urls, gallery_provided = self._extract_gallery_urls_from_payload(
                raw_payload
            )

            payload = self._split_payload(raw_payload)
            if gallery_provided:
                payload = self._apply_gallery_urls(payload, gallery_urls)
            payload = self._prepare_sql_payload(payload)
        except ValidationError:
            logger.exception("[estate:update] pk=%s normalization validation failed", pk)
            raise
        except Exception as exc:
            logger.exception("[estate:update] pk=%s normalization failed", pk)
            return Response(
                {
                    "detail": "Estate payload normalization failed.",
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        logger.warning(
            "[estate:update] pk=%s normalized payload keys=%s gallery_count=%s",
            pk,
            sorted(payload.keys()),
            len(gallery_urls),
        )
        if not payload:
            return Response({"detail": "No valid fields provided."}, status=status.HTTP_400_BAD_REQUEST)

        instance = EstateProperty.objects.filter(id=pk).first()
        if not instance:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        for key, value in payload.items():
            setattr(instance, key, value)
        try:
            instance.save(update_fields=list(payload.keys()))
        except (DataError, IntegrityError, DatabaseError, TypeError, ValueError) as exc:
            logger.exception("[estate:update] pk=%s failed", pk)
            raise ValidationError(
                {"detail": "Invalid payload for estate property update.", "error": str(exc)}
            ) from exc
        return self.retrieve(request, pk=pk)

    def destroy(self, request, pk=None):
        deleted_count, _ = EstateProperty.objects.filter(id=pk).delete()
        if deleted_count == 0:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EstatePropertyListCreateAPIView(EstatePropertyAPIViewMixinMethods, APIView):
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        return self.list(request)

    def post(self, request, *args, **kwargs):
        return self.create(request)


class EstatePropertyDetailAPIView(EstatePropertyAPIViewMixinMethods, APIView):
    def get(self, request, pk, *args, **kwargs):
        return self.retrieve(request, pk=pk)

    def put(self, request, pk, *args, **kwargs):
        return self.update(request, pk=pk)

    def patch(self, request, pk, *args, **kwargs):
        return self.partial_update(request, pk=pk)

    def delete(self, request, pk, *args, **kwargs):
        return self.destroy(request, pk=pk)


class EstatePropertySchemaAPIView(EstatePropertyAPIViewMixinMethods, APIView):
    def get(self, request, *args, **kwargs):
        return self.schema(request)


class EstatePropertyMediaUploadAPIView(EstatePropertyAPIViewMixinMethods, APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        files = request.FILES.getlist("images")
        logger.warning(
            "[estate:media-upload] incoming files=%s storage_backend=%s",
            len(files),
            f"{default_storage.__class__.__module__}.{default_storage.__class__.__name__}",
        )
        if not files:
            return Response(
                {"detail": "No files provided. Use multipart field name 'images'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(files) > self.MAX_MEDIA_UPLOAD_FILES:
            return Response(
                {
                    "detail": (
                        f"Too many files. Maximum {self.MAX_MEDIA_UPLOAD_FILES} "
                        "images per request."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded = []
        for index, file_obj in enumerate(files):
            content_type = str(getattr(file_obj, "content_type", "") or "")
            if not content_type.startswith("image/"):
                return Response(
                    {
                        "detail": (
                            f"Invalid file type for item #{index + 1}. "
                            "Only image uploads are allowed."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            file_size = int(getattr(file_obj, "size", 0) or 0)
            if file_size > self.MAX_MEDIA_UPLOAD_SIZE_BYTES:
                return Response(
                    {
                        "detail": (
                            f"File too large for item #{index + 1}. "
                            f"Max size is {self.MAX_MEDIA_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            original_name = str(getattr(file_obj, "name", "") or "image")
            base_name = os.path.basename(original_name).replace(" ", "_")
            stamped_name = (
                f"estate-properties/{timezone.now():%Y/%m}/"
                f"{uuid4().hex}-{base_name}"
            )
            try:
                stored_path = default_storage.save(stamped_name, file_obj)
            except CloudinaryError:
                logger.exception(
                    "[estate:media-upload] provider_error filename=%s backend=%s",
                    original_name,
                    f"{default_storage.__class__.__module__}.{default_storage.__class__.__name__}",
                )
                return Response(
                    {
                        "detail": "Image upload provider rejected the upload.",
                        "error": (
                            "Cloudinary upload failed. Check CLOUDINARY_URL, "
                            "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and "
                            "CLOUDINARY_CLOUD_NAME."
                        ),
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            except Exception:
                logger.exception(
                    "[estate:media-upload] storage_error filename=%s backend=%s",
                    original_name,
                    f"{default_storage.__class__.__module__}.{default_storage.__class__.__name__}",
                )
                return Response(
                    {
                        "detail": "Failed to store uploaded image.",
                        "error": "Unexpected storage error while uploading image.",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            raw_url = default_storage.url(stored_path)
            file_url = (
                raw_url
                if str(raw_url).startswith("http://")
                or str(raw_url).startswith("https://")
                else request.build_absolute_uri(raw_url)
            )
            logger.warning(
                "[estate:media-upload] saved filename=%s storage_key=%s url=%s",
                original_name,
                stored_path,
                file_url,
            )

            uploaded.append(
                {
                    "url": file_url,
                    "storage_key": stored_path,
                    "filename": original_name,
                    "content_type": content_type,
                    "size": file_size,
                }
            )

        return Response({"count": len(uploaded), "results": uploaded})
