from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import quote, urlencode

import requests
from django.utils import timezone as dj_timezone

from mls.models import AmplifySoldProperty, AmplifySoldSyncState


logger = logging.getLogger(__name__)


def _as_decimal(value: Any) -> Decimal | None:
    if value in (None, "", "null"):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _as_int(value: Any) -> int | None:
    if value in (None, "", "null"):
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def _as_float(value: Any) -> float | None:
    if value in (None, "", "null"):
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _as_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _as_date(value: Any):
    dt = _as_datetime(value)
    if dt is not None:
        return dt.date()
    if not value:
        return None
    s = str(value).strip()
    if len(s) >= 10:
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


def _normalize_fsa(postal_code: str | None) -> str:
    if not postal_code:
        return ""
    compact = "".join(ch for ch in str(postal_code).upper() if ch.isalnum())
    return compact[:3] if len(compact) >= 3 else ""


@dataclass
class SyncResult:
    fetched: int
    upserted: int
    skipped: int
    watermark: datetime | None


class AmplifySoldSyncError(RuntimeError):
    pass


class AmplifySoldClient:
    def __init__(self):
        self.base_url = (os.environ.get("AMPLIFY_BASE_URL") or "https://query.ampre.ca/odata").rstrip("/")
        self.token = (os.environ.get("AMPLIFY_BEARER_TOKEN") or "").strip()
        self.status_field = (os.environ.get("AMPLIFY_SOLD_STATUS_FIELD") or "StandardStatus").strip() or "StandardStatus"
        self.status_value = (os.environ.get("AMPLIFY_SOLD_STATUS_VALUE") or "Closed").strip() or "Closed"
        self.timeout = int(os.environ.get("AMPLIFY_SYNC_TIMEOUT_SECONDS", "30"))
        self.page_size = max(1, min(int(os.environ.get("AMPLIFY_SYNC_PAGE_SIZE", "200")), 1000))
        self.property_path = "/Property"
        self.custom_filter = (os.environ.get("AMPLIFY_SOLD_FILTER") or "").strip()
        self.custom_select = (os.environ.get("AMPLIFY_SOLD_SELECT") or "").strip()

    def _headers(self) -> dict[str, str]:
        if not self.token:
            raise AmplifySoldSyncError("AMPLIFY_BEARER_TOKEN is not configured")
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
        }

    def _append_incremental_clause(self, base: str, watermark: datetime | None) -> str:
        if watermark is None:
            return base
        iso = watermark.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        if base:
            return f"{base} and ModificationTimestamp ge {iso}"
        return f"ModificationTimestamp ge {iso}"

    def _format_odata_literal(self, raw: str) -> str:
        """
        Convert env status value into a type-correct OData literal when possible.
        """
        value = (raw or "").strip()
        low = value.lower()
        if low in {"true", "false"}:
            return low
        if low in {"1", "0"}:
            return "true" if low == "1" else "false"
        escaped = value.replace("'", "''")
        return f"'{escaped}'"

    def _candidate_filters(self, *, watermark: datetime | None, full_sync: bool) -> list[str]:
        if self.custom_filter:
            candidates = [self.custom_filter]
            if not full_sync and watermark:
                candidates.insert(0, self._append_incremental_clause(self.custom_filter, watermark))
            return [c for c in candidates if c]

        base_filters: list[str] = [
            f"{self.status_field} eq {self._format_odata_literal(self.status_value)}",
            "CloseDate ne null",
            "ClosePrice gt 0",
        ]
        candidates: list[str] = []
        if not full_sync and watermark:
            for base in base_filters:
                candidates.append(self._append_incremental_clause(base, watermark))
            candidates.append(self._append_incremental_clause("", watermark))
        candidates.extend(base_filters)
        candidates.append("")

        deduped: list[str] = []
        for c in candidates:
            if c not in deduped:
                deduped.append(c)
        return deduped

    def _candidate_selects(self) -> list[str]:
        if self.custom_select:
            return [self.custom_select]
        return [
            (
                "ListingKey,ListPrice,ClosePrice,CloseDate,City,PostalCode,PropertySubType,"
                "BedroomsTotal,BathroomsTotalInteger,LivingArea,Latitude,Longitude,"
                "StandardStatus,DaysOnMarket,ModificationTimestamp"
            ),
            (
                "ListingKey,ListPrice,ClosePrice,CloseDate,City,PostalCode,PropertySubType,"
                "BedroomsTotal,BathroomsTotalInteger,Latitude,Longitude,"
                "StandardStatus,DaysOnMarket,ModificationTimestamp"
            ),
            (
                "ListingKey,ListPrice,ClosePrice,CloseDate,City,PostalCode,PropertySubType,"
                "BedroomsTotal,BathroomsTotalInteger,Latitude,Longitude,StandardStatus,ModificationTimestamp"
            ),
            (
                "ListingKey,ListPrice,ClosePrice,CloseDate,City,PostalCode,PropertySubType,"
                "BedroomsTotal,BathroomsTotalInteger,StandardStatus,ModificationTimestamp"
            ),
        ]

    def _iter_rows_with_filter(self, *, filter_expr: str, select_expr: str, max_pages: int = 0):
        endpoint = f"{self.base_url}{self.property_path}"
        params = {
            "$select": select_expr,
            "$orderby": "ModificationTimestamp asc",
            "$top": self.page_size,
        }
        if filter_expr:
            params["$filter"] = filter_expr
        query = urlencode(params, quote_via=quote)
        next_url = f"{endpoint}?{query}"
        page_count = 0

        while next_url:
            if max_pages > 0 and page_count >= max_pages:
                break
            response = requests.get(
                next_url,
                headers=self._headers(),
                timeout=self.timeout,
            )
            if response.status_code >= 400:
                raise AmplifySoldSyncError(
                    f"Amplify request failed ({response.status_code}): {response.text[:500]}"
                )
            payload = response.json()
            rows = payload.get("value") or []
            for row in rows:
                yield row

            next_url = payload.get("@odata.nextLink")
            page_count += 1

    def iter_rows(self, *, watermark: datetime | None, full_sync: bool = False, max_pages: int = 0):
        errors: list[str] = []
        for filter_expr in self._candidate_filters(watermark=watermark, full_sync=full_sync):
            for select_expr in self._candidate_selects():
                logger.info("Amplify sold sync trying filter/select: %s | %s", filter_expr, select_expr)
                try:
                    yield from self._iter_rows_with_filter(
                        filter_expr=filter_expr,
                        select_expr=select_expr,
                        max_pages=max_pages,
                    )
                    return
                except AmplifySoldSyncError as exc:
                    err = str(exc)
                    errors.append(err)
                    # Retry on OData type incompatibility / bad field/filter shape
                    if (
                        "not compatible" in err.lower()
                        or "invalid" in err.lower()
                        or "not defined in type" in err.lower()
                        or "(400)" in err
                    ):
                        logger.warning("Amplify sold sync query variant failed, trying fallback: %s", err)
                        continue
                    raise
        raise AmplifySoldSyncError(" ; ".join(errors) if errors else "Amplify sold sync failed with unknown filter error")


def run_amplify_sold_sync(*, full_sync: bool = False, max_pages: int = 0, dry_run: bool = False) -> SyncResult:
    state, _ = AmplifySoldSyncState.objects.get_or_create(
        key=AmplifySoldSyncState.DEFAULT_KEY,
        defaults={"key": AmplifySoldSyncState.DEFAULT_KEY},
    )
    state.last_attempted_sync_at = dj_timezone.now()
    state.last_error = ""
    state.save(update_fields=["last_attempted_sync_at", "last_error", "updated_at"])

    client = AmplifySoldClient()
    watermark = None if full_sync else state.last_successful_modification_timestamp

    fetched = 0
    upserted = 0
    skipped = 0
    max_mod_ts: datetime | None = watermark

    try:
        for raw in client.iter_rows(watermark=watermark, full_sync=full_sync, max_pages=max_pages):
            fetched += 1
            listing_key = str(raw.get("ListingKey") or "").strip()
            if not listing_key:
                skipped += 1
                continue

            mod_ts = _as_datetime(raw.get("ModificationTimestamp"))
            close_date = _as_date(raw.get("CloseDate"))
            postal_code = (raw.get("PostalCode") or "").strip() or None
            close_price = _as_decimal(raw.get("ClosePrice"))
            list_price = _as_decimal(raw.get("ListPrice"))
            sold_price = close_price if close_price is not None else list_price

            # Board schemas differ. Prefer LivingArea, then known alternates if present.
            living_area_raw = (
                raw.get("LivingArea")
                or raw.get("AboveGradeFinishedArea")
                or raw.get("BuildingAreaTotal")
            )

            defaults = {
                "standard_status": (raw.get("StandardStatus") or "").strip() or None,
                "list_price": list_price,
                "close_price": close_price,
                "sold_price": sold_price,
                "close_date": close_date,
                "modification_timestamp": mod_ts,
                "city": (raw.get("City") or "").strip() or None,
                "postal_code": postal_code,
                "fsa": _normalize_fsa(postal_code),
                "property_sub_type": (raw.get("PropertySubType") or "").strip() or None,
                "bedrooms_total": _as_int(raw.get("BedroomsTotal")),
                "bathrooms_total_integer": _as_int(raw.get("BathroomsTotalInteger")),
                "living_area": _as_decimal(living_area_raw),
                "latitude": _as_float(raw.get("Latitude")),
                "longitude": _as_float(raw.get("Longitude")),
                "days_on_market": _as_int(raw.get("DaysOnMarket")),
                "raw_payload": raw,
            }

            if not dry_run:
                AmplifySoldProperty.objects.update_or_create(
                    listing_key=listing_key,
                    defaults=defaults,
                )
            upserted += 1
            if mod_ts and (max_mod_ts is None or mod_ts > max_mod_ts):
                max_mod_ts = mod_ts

        if dry_run:
            return SyncResult(fetched=fetched, upserted=upserted, skipped=skipped, watermark=max_mod_ts)

        state.last_successful_sync_at = dj_timezone.now()
        state.last_successful_modification_timestamp = max_mod_ts
        state.total_rows_synced = (state.total_rows_synced or 0) + upserted
        state.save(
            update_fields=[
                "last_successful_sync_at",
                "last_successful_modification_timestamp",
                "total_rows_synced",
                "updated_at",
            ]
        )

        return SyncResult(fetched=fetched, upserted=upserted, skipped=skipped, watermark=max_mod_ts)
    except Exception as exc:
        logger.exception("Amplify sold sync failed")
        state.last_error = str(exc)[:2000]
        state.save(update_fields=["last_error", "updated_at"])
        raise
