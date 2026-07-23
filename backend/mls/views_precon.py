import logging
import re
from decimal import Decimal, InvalidOperation
from io import BytesIO

import pandas as pd
from django.db import transaction
from django.utils.text import slugify
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from mls.models import Content, PreComFloorPlanIntent, PreComProperty
from mls.serializers_precon import (
    PreComBulkUploadResponseSerializer,
    PreComBulkUploadSerializer,
    PreComPropertyDetailSerializer,
    PreComPropertySerializer,
)

logger = logging.getLogger(__name__)


PRECON_BULK_COLUMNS = {
    "wp_id",
    "title",
    "slug",
    "content_type",
    "status",
    "price",
    "bedrooms",
    "bathrooms",
    "garages",
    "area",
    "lot_size",
    "latitude",
    "longitude",
    "address",
}


def _clean(value):
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


def _to_decimal(value):
    value = _clean(value)
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f"invalid decimal value: {value!r}")


def _to_int(value):
    value = _clean(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        raise ValueError(f"invalid integer value: {value!r}")


def _read_upload_to_dataframe(uploaded_file):
    name = (uploaded_file.name or "").lower()
    data = uploaded_file.read()
    buffer = BytesIO(data)
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(buffer)
    if name.endswith(".csv") or not name:
        return pd.read_csv(buffer)
    raise ValueError("Unsupported file type. Upload a .csv, .xlsx, or .xls file.")


class PreComPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class PreComPropertyDetailAPIView(RetrieveAPIView):
    """Retrieve a single pre-construction property by its primary key."""

    queryset = (
        PreComProperty.objects.select_related("content", "content__author")
        .filter(content__status=Content.PUBLISH)
        .prefetch_related(
            "content__taxonomies",
            "content__attachments",
            "content__meta",
        )
    )
    serializer_class = PreComPropertyDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "pk"


class PreComPropertyRecommendationsAPIView(APIView):
    """Return related pre-construction projects without mixing MLS inventory."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            target = (
                PreComProperty.objects.select_related("content")
                .get(pk=pk, content__status=Content.PUBLISH)
            )
        except PreComProperty.DoesNotExist:
            return Response(
                {"detail": "Pre-construction property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        limit = max(2, min(int(request.query_params.get("limit", "4")), 8))
        candidates = list(
            PreComProperty.objects.select_related("content")
            .filter(content__status=Content.PUBLISH)
            .prefetch_related("content__attachments")
            .exclude(pk=target.pk)
            .order_by("-id")[:120]
        )

        target_price = float(target.price) if target.price is not None else None
        target_terms = {
            term
            for term in re.findall(r"[a-z0-9]+", f"{target.content.title} {target.address}".lower())
            if len(term) > 3 and term not in {"homes", "towns", "community", "communities", "the", "with"}
        }

        def score(candidate):
            candidate_terms = set(
                re.findall(r"[a-z0-9]+", f"{candidate.content.title} {candidate.address}".lower())
            )
            shared_terms = len(target_terms & candidate_terms)
            price_score = 0.0
            if target_price and candidate.price is not None:
                delta = abs(float(candidate.price) - target_price) / target_price
                price_score = max(0.0, 1.0 - min(delta, 1.0))
            return (shared_terms * 2) + price_score

        candidates.sort(key=score, reverse=True)
        return Response(
            PreComPropertySerializer(candidates[:limit], many=True).data,
            status=status.HTTP_200_OK,
        )


class PreComFloorPlanIntentAPIView(APIView):
    """Record an authenticated user's request before returning its floor-plan URL."""

    permission_classes = [IsAuthenticated]

    @staticmethod
    def _floor_plan_url(property):
        meta = {item.key: item.value for item in property.content.meta.all()}
        meta_url = str(meta.get("floor_plan_url") or "").strip()
        if meta_url:
            return meta_url

        attachment = next(
            (
                item
                for item in property.content.attachments.all()
                if item.url and "floor" in (item.title or "").lower()
            ),
            None,
        )
        return attachment.url if attachment else ""

    def post(self, request, pk):
        try:
            property = (
                PreComProperty.objects.select_related("content")
                .prefetch_related("content__attachments", "content__meta")
                .get(pk=pk)
            )
        except PreComProperty.DoesNotExist:
            return Response(
                {"detail": "Pre-construction property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not request.user.phone_verified:
            return Response(
                {"detail": "Phone verification is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        source_url = self._floor_plan_url(property)
        if not source_url:
            return Response(
                {"detail": "Floor plans are unavailable for this property."},
                status=status.HTTP_404_NOT_FOUND,
            )

        intent = PreComFloorPlanIntent.objects.create(
            property=property,
            user=request.user,
            source_url=source_url,
        )
        return Response(
            {"intent_id": intent.id, "access_url": source_url},
            status=status.HTTP_201_CREATED,
        )


class PreComPropertyListAPIView(ListAPIView):
    """Paginated list of pre-construction properties.

    Only published projects are public. The endpoint is intentionally not
    response-cached: a manual admin save should appear on the frontend
    immediately.
    """

    queryset = (
        PreComProperty.objects.select_related("content")
        .filter(content__status=Content.PUBLISH)
        .prefetch_related("content__attachments")
        .only(
            "id",
            "price",
            "bedrooms",
            "bathrooms",
            "garages",
            "area",
            "lot_size",
            "latitude",
            "longitude",
            "address",
            "content__id",
            "content__wp_id",
            "content__title",
            "content__slug",
            "content__status",
        )
        .order_by("-id")
    )
    serializer_class = PreComPropertySerializer
    pagination_class = PreComPagination
    permission_classes = [AllowAny]


class PreComPropertyBulkUploadAPIView(APIView):
    """
    Accepts a CSV or Excel file and upserts PreComProperty rows.

    Each row must include a ``wp_id`` that identifies the underlying Content.
    A new Content record is created on first import; subsequent uploads with
    the same ``wp_id`` update the existing PreComProperty in place.
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    @extend_schema(
        request=PreComBulkUploadSerializer,
        responses={
            200: PreComBulkUploadResponseSerializer,
            400: OpenApiResponse(description="Malformed upload"),
        },
    )
    def post(self, request):
        print("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq")
        serializer = PreComBulkUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["file"]

        try:
            df = _read_upload_to_dataframe(uploaded)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Failed to parse pre-con upload")
            return Response(
                {"detail": f"Could not parse file: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "wp_id" not in df.columns:
            return Response(
                {"detail": "Missing required column: wp_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse all rows into memory first — no DB traffic in this loop.
        parsed_rows = []
        errors = []
        seen_wp_ids = set()

        for idx, row in df.iterrows():
            row_number = int(idx) + 2
            row_dict = row.to_dict()
            try:
                wp_id = _to_int(row_dict.get("wp_id"))
                if wp_id is None:
                    raise ValueError("wp_id is required")
                if wp_id in seen_wp_ids:
                    raise ValueError(f"duplicate wp_id in file: {wp_id}")
                seen_wp_ids.add(wp_id)

                title = _clean(row_dict.get("title")) or f"Property {wp_id}"
                slug = _clean(row_dict.get("slug")) or slugify(title)

                content_data = {
                    "wp_id": wp_id,
                    "content_type": _clean(row_dict.get("content_type"))
                    or Content.PROPERTY,
                    "title": title,
                    "slug": slug,
                    "status": _clean(row_dict.get("status")) or "publish",
                }
                property_data = {
                    "price": _to_decimal(row_dict.get("price")),
                    "bedrooms": _to_int(row_dict.get("bedrooms")),
                    "bathrooms": _to_decimal(row_dict.get("bathrooms")),
                    "garages": _to_int(row_dict.get("garages")),
                    "area": _to_decimal(row_dict.get("area")),
                    "lot_size": _to_decimal(row_dict.get("lot_size")),
                    "latitude": _to_decimal(row_dict.get("latitude")),
                    "longitude": _to_decimal(row_dict.get("longitude")),
                    "address": _clean(row_dict.get("address")) or "",
                }
                parsed_rows.append(
                    {"content": content_data, "property": property_data}
                )
            except Exception as exc:
                errors.append(
                    {
                        "row": row_number,
                        "wp_id": str(row_dict.get("wp_id", "")),
                        "error": str(exc),
                    }
                )

        if not parsed_rows:
            return Response(
                {
                    "created": 0,
                    "updated": 0,
                    "skipped": len(errors),
                    "errors": errors,
                },
                status=status.HTTP_200_OK,
            )

        wp_ids = [r["content"]["wp_id"] for r in parsed_rows]
        content_fields = ["content_type", "title", "slug", "status"]
        property_fields = [
            "price",
            "bedrooms",
            "bathrooms",
            "garages",
            "area",
            "lot_size",
            "latitude",
            "longitude",
            "address",
        ]

        created = 0
        updated = 0

        with transaction.atomic():
            # 1) Single query: existing Content by wp_id.
            existing_content = {
                c.wp_id: c for c in Content.objects.filter(wp_id__in=wp_ids)
            }

            contents_to_create = []
            contents_to_update = []
            for r in parsed_rows:
                cdata = r["content"]
                existing = existing_content.get(cdata["wp_id"])
                if existing:
                    for f in content_fields:
                        setattr(existing, f, cdata[f])
                    contents_to_update.append(existing)
                else:
                    contents_to_create.append(Content(**cdata))

            # 2) Bulk create new Content rows (Postgres populates PKs).
            if contents_to_create:
                Content.objects.bulk_create(contents_to_create)
            # 3) Bulk update existing Content rows.
            if contents_to_update:
                Content.objects.bulk_update(contents_to_update, content_fields)

            content_by_wp_id = {c.wp_id: c for c in contents_to_update}
            for c in contents_to_create:
                content_by_wp_id[c.wp_id] = c

            content_ids = [c.pk for c in content_by_wp_id.values()]

            # 4) Single query: existing PreComProperty by content_id.
            existing_props = {
                p.content_id: p
                for p in PreComProperty.objects.filter(content_id__in=content_ids)
            }

            props_to_create = []
            props_to_update = []
            for r in parsed_rows:
                content_obj = content_by_wp_id[r["content"]["wp_id"]]
                pdata = r["property"]
                existing_prop = existing_props.get(content_obj.pk)
                if existing_prop:
                    for f in property_fields:
                        setattr(existing_prop, f, pdata[f])
                    props_to_update.append(existing_prop)
                    updated += 1
                else:
                    props_to_create.append(
                        PreComProperty(content=content_obj, **pdata)
                    )
                    created += 1

            # 5) Bulk create/update PreComProperty rows.
            if props_to_create:
                PreComProperty.objects.bulk_create(props_to_create)
            if props_to_update:
                PreComProperty.objects.bulk_update(props_to_update, property_fields)

        payload = {
            "created": created,
            "updated": updated,
            "skipped": len(errors),
            "errors": errors,
        }
        return Response(payload, status=status.HTTP_200_OK)
