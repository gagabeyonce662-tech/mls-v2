import json

from django.conf import settings
from django.db import DataError, IntegrityError, ProgrammingError, connection
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import EstatePropertyWriteSerializer


class EstatePropertyAPIViewMixin:
    permission_classes = [AllowAny]
    table_name = "mls_estateproperty"
    wp_meta_column = "wp_meta_json"
    wp_terms_column = "wp_terms_json"
    wp_post_column = "wp_post_json"
    description_sections_column = "description_sections_json"

    
class EstatePropertyAPIViewMixinMethods(EstatePropertyAPIViewMixin):
    # WordPress/Houzez keys that should map to first-class estate columns.
    table_name = "mls_estateproperty"
    wp_meta_column = "wp_meta_json"
    wp_terms_column = "wp_terms_json"
    wp_post_column = "wp_post_json"
    description_sections_column = "description_sections_json"

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

    def get_permissions(self):
        if self.request and self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    @staticmethod
    def _dictfetchall(cursor):
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    @classmethod
    def _columns(cls):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = %s
                ORDER BY ordinal_position
                """,
                [cls.table_name],
            )
            return cls._dictfetchall(cursor)

    @classmethod
    def _column_names(cls):
        return [c["column_name"] for c in cls._columns()]

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
        Convert Python container values for JSON columns into DB-bindable JSON text.
        Raw cursor bindings do not auto-adapt dict/list to JSONB.
        """
        json_columns = {
            self.wp_meta_column,
            self.wp_terms_column,
            self.wp_post_column,
            self.description_sections_column,
        }
        prepared = {}
        for key, value in payload.items():
            if key in json_columns and isinstance(value, (dict, list, tuple, set)):
                serializable = list(value) if isinstance(value, set) else value
                prepared[key] = json.dumps(serializable)
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
        order_sql = f"{order_key} DESC" if ordering.startswith("-") else f"{order_key} ASC"

        where = []
        params = []
        if search:
            where.append(
                "(COALESCE(unparsed_address,'') ILIKE %s OR COALESCE(listing_key,'') ILIKE %s OR COALESCE(city,'') ILIKE %s OR COALESCE(property_title,'') ILIKE %s OR COALESCE(property_description,'') ILIKE %s OR COALESCE(property_slug,'') ILIKE %s)"
            )
            q = f"%{search}%"
            params.extend([q, q, q, q, q, q])
        if city:
            where.append("city ILIKE %s")
            params.append(f"%{city}%")
        if status_value:
            where.append("standard_status = %s")
            params.append(status_value)
        if publish_status:
            where.append("publish_status = %s")
            params.append(publish_status)
        if expires_from:
            where.append("expires_at >= %s")
            params.append(expires_from)
        if expires_to:
            where.append("expires_at <= %s")
            params.append(expires_to)

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""

        with connection.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {self.table_name} {where_sql}", params)
            total = cursor.fetchone()[0]
            cursor.execute(
                f"""
                SELECT * FROM {self.table_name}
                {where_sql}
                ORDER BY {order_sql}
                LIMIT %s OFFSET %s
                """,
                [*params, page_size, offset],
            )
            rows = self._dictfetchall(cursor)

        return Response({"count": total, "page": page, "page_size": page_size, "results": rows})

    def retrieve(self, request, pk=None):
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = %s", [pk])
            rows = self._dictfetchall(cursor)
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(rows[0])

    def create(self, request):
        serializer = EstatePropertyWriteSerializer(data={"payload": request.data})
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data["payload"])
        payload = self._split_payload(payload)
        payload = self._prepare_sql_payload(payload)
        payload.setdefault("is_featured", False)
        if not payload.get("listing_key"):
            return Response(
                {"listing_key": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        keys = list(payload.keys())
        vals = [payload[k] for k in keys]
        cols = ", ".join(keys)
        placeholders = ", ".join(["%s"] * len(keys))

        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    f"INSERT INTO {self.table_name} ({cols}) VALUES ({placeholders}) RETURNING id",
                    vals,
                )
                new_id = cursor.fetchone()[0]
            except (DataError, IntegrityError, ProgrammingError) as exc:
                raise ValidationError(
                    {"detail": "Invalid payload for estate property create.", "error": str(exc)}
                ) from exc
        return self.retrieve(request, pk=new_id)

    def update(self, request, pk=None):
        return self._update_internal(request, pk)

    def partial_update(self, request, pk=None):
        return self._update_internal(request, pk)

    def _update_internal(self, request, pk):
        serializer = EstatePropertyWriteSerializer(data={"payload": request.data})
        serializer.is_valid(raise_exception=True)
        payload = dict(serializer.validated_data["payload"])
        payload = self._split_payload(payload)
        payload = self._prepare_sql_payload(payload)
        if not payload:
            return Response({"detail": "No valid fields provided."}, status=status.HTTP_400_BAD_REQUEST)

        set_sql = ", ".join([f"{k} = %s" for k in payload.keys()])
        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    f"UPDATE {self.table_name} SET {set_sql} WHERE id = %s",
                    [*payload.values(), pk],
                )
            except (DataError, IntegrityError, ProgrammingError) as exc:
                raise ValidationError(
                    {"detail": "Invalid payload for estate property update.", "error": str(exc)}
                ) from exc
            if cursor.rowcount == 0:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return self.retrieve(request, pk=pk)

    def destroy(self, request, pk=None):
        with connection.cursor() as cursor:
            cursor.execute(f"DELETE FROM {self.table_name} WHERE id = %s", [pk])
            if cursor.rowcount == 0:
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
