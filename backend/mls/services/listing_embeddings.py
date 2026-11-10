"""Listing embeddings for AI search's "best match" ordering.

``embed_pending`` (run by ``manage.py embed_listings``, e.g. after each DDF
sync) embeds every listing whose description text changed since its last
embedding. ``rank_ids`` re-orders an already-filtered candidate list by cosine
similarity to the searcher's soft preferences ("near subway, big backyard").

Ranking never filters: the structured filters decide *which* listings match,
this only decides their order. Listings not embedded yet keep their original
order after the embedded ones, and any OpenAI failure returns ``None`` so the
caller keeps the normal ordering.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Iterable, Sequence

import numpy as np
from django.core.cache import cache
from django.db import transaction

from mls.models import Property, PropertyEmbedding

from . import openai_client

logger = logging.getLogger(__name__)

MAX_REMARKS_CHARS = 1500
MAX_TEXT_CHARS = 3000
QUERY_VECTOR_TTL = 7 * 24 * 60 * 60
IN_CHUNK = 900  # stays under SQLite's bound-parameter limit
MAX_CONSECUTIVE_FAILURES = 3

TEXT_FIELDS = (
    "id",
    "public_remarks",
    "property_sub_type",
    "structure_type",
    "architectural_style",
    "common_interest",
    "city",
    "subdivision_name",
    "city_region",
    "bedrooms_total",
    "bathrooms_total_integer",
    "building_area_total",
    "year_built",
    "list_price",
    "lease_amount",
    "total_actual_rent",
    "parking_total",
    "parking_features",
    "basement",
    "pool_features",
    "waterfront_features",
    "view",
    "community_features",
    "lot_features",
    "exterior_features",
    "building_features",
    "appliances",
    "fireplace_features",
    "cooling",
    "flooring",
)


def _text(value) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    # DDF list fields arrive as "['A', 'B']" strings; flatten them.
    return text.strip("[]").replace("'", "").replace('"', "").strip()


def build_embedding_text(prop: Property) -> str:
    kind = _text(prop.structure_type) or _text(prop.property_sub_type)
    lines = []
    header = " ".join(p for p in (kind, _text(prop.architectural_style), _text(prop.common_interest)) if p)
    if header:
        lines.append(header)
    is_rental = not prop.list_price and bool(prop.lease_amount or prop.total_actual_rent)
    lines.append("For rent" if is_rental else "For sale")
    location = ", ".join(p for p in (_text(prop.subdivision_name), _text(prop.city_region), _text(prop.city)) if p)
    if location:
        lines.append(f"Location: {location}")
    size = []
    if prop.bedrooms_total:
        size.append(f"{prop.bedrooms_total} bedrooms")
    if prop.bathrooms_total_integer:
        size.append(f"{prop.bathrooms_total_integer} bathrooms")
    if prop.building_area_total:
        size.append(f"{int(prop.building_area_total)} sq ft")
    if prop.year_built:
        size.append(f"built {prop.year_built}")
    if prop.parking_total:
        size.append(f"{int(prop.parking_total)} parking")
    if size:
        lines.append(", ".join(size))
    for label, field in (
        ("Parking", "parking_features"),
        ("Basement", "basement"),
        ("Pool", "pool_features"),
        ("Waterfront", "waterfront_features"),
        ("View", "view"),
        ("Community", "community_features"),
        ("Lot", "lot_features"),
        ("Exterior", "exterior_features"),
        ("Building", "building_features"),
        ("Appliances", "appliances"),
        ("Fireplace", "fireplace_features"),
        ("Cooling", "cooling"),
        ("Flooring", "flooring"),
    ):
        value = _text(getattr(prop, field, None))
        if value:
            lines.append(f"{label}: {value}")
    remarks = _text(prop.public_remarks)[:MAX_REMARKS_CHARS]
    if remarks:
        lines.append(remarks)
    return "\n".join(lines)[:MAX_TEXT_CHARS]


def _config() -> tuple[str, int]:
    return openai_client.embedding_model(), openai_client.embedding_dimensions()


def text_hash(text: str, model: str, dimensions: int) -> str:
    return hashlib.sha256(f"{model}:{dimensions}:{text}".encode("utf-8")).hexdigest()


def pack(vector: Sequence[float]) -> bytes:
    return np.asarray(vector, dtype=np.float32).tobytes()


def unpack(blob: bytes | memoryview) -> np.ndarray:
    return np.frombuffer(bytes(blob), dtype=np.float32)


def _normalise(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=-1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def embed_pending(*, limit: int | None = None, batch_size: int = 100) -> dict[str, int]:
    """Embed listings that are new or whose text changed. Returns counts."""
    model, dims = _config()
    existing = dict(PropertyEmbedding.objects.values_list("property_id", "text_hash"))
    summary = {"checked": 0, "embedded": 0, "unchanged": 0, "failed": 0}

    pending: list[tuple[int, str, str]] = []
    for prop in Property.objects.only(*TEXT_FIELDS).order_by("-modification_timestamp", "id").iterator(chunk_size=500):
        summary["checked"] += 1
        text = build_embedding_text(prop)
        digest = text_hash(text, model, dims)
        if existing.get(prop.id) == digest:
            summary["unchanged"] += 1
            continue
        pending.append((prop.id, text, digest))
        if limit is not None and len(pending) >= limit:
            break

    failures = 0
    for start in range(0, len(pending), batch_size):
        batch = pending[start : start + batch_size]
        try:
            vectors = openai_client.embed([text for _, text, _ in batch])
        except openai_client.OpenAIError as exc:
            logger.warning("Embedding batch failed: %s", exc)
            summary["failed"] += len(batch)
            failures += 1
            if failures >= MAX_CONSECUTIVE_FAILURES:
                logger.error("Stopping embed run after %s consecutive failures.", failures)
                summary["failed"] += len(pending) - start - len(batch)
                break
            continue
        failures = 0
        ids = [pid for pid, _, _ in batch]
        with transaction.atomic():
            PropertyEmbedding.objects.filter(property_id__in=ids).delete()
            PropertyEmbedding.objects.bulk_create(
                PropertyEmbedding(
                    property_id=pid,
                    model=model,
                    dimensions=dims,
                    text_hash=digest,
                    vector=pack(vector),
                )
                for (pid, _, digest), vector in zip(batch, vectors)
            )
        summary["embedded"] += len(batch)
    return summary


def query_vector(text: str) -> np.ndarray | None:
    """Embedding of a search phrase (cached), or None if OpenAI is unavailable."""
    text = (text or "").strip()[:300]
    if not text or not openai_client.is_configured():
        return None
    model, dims = _config()
    key = "ai-search:qvec:" + hashlib.sha256(f"{model}:{dims}:{text.lower()}".encode("utf-8")).hexdigest()
    blob = cache.get(key)
    if blob is None:
        try:
            [vector] = openai_client.embed([text], timeout=8)
        except openai_client.OpenAIError as exc:
            logger.warning("Query embedding failed: %s", exc)
            return None
        blob = pack(vector)
        cache.set(key, blob, QUERY_VECTOR_TTL)
    return unpack(blob)


def _vectors_for(ids: Iterable[int], model: str, dims: int) -> dict[int, np.ndarray]:
    ids = list(ids)
    found: dict[int, np.ndarray] = {}
    for start in range(0, len(ids), IN_CHUNK):
        rows = PropertyEmbedding.objects.filter(
            property_id__in=ids[start : start + IN_CHUNK], model=model, dimensions=dims
        ).values_list("property_id", "vector")
        for pid, blob in rows:
            found[pid] = unpack(blob)
    return found


def rank_ids(candidate_ids: Sequence[int], text: str) -> list[int] | None:
    """``candidate_ids`` re-ordered by similarity to ``text``.

    None means "keep the original order": no query vector, or none of the
    candidates is embedded yet.
    """
    if not candidate_ids:
        return None
    qv = query_vector(text)
    if qv is None:
        return None
    model, dims = _config()
    vectors = _vectors_for(candidate_ids, model, dims)
    if not vectors:
        return None
    embedded = [pid for pid in candidate_ids if pid in vectors]
    matrix = _normalise(np.vstack([vectors[pid] for pid in embedded]))
    scores = matrix @ _normalise(qv.reshape(1, -1))[0]
    # Stable: equal scores keep the filter order (e.g. newest first).
    order = sorted(range(len(embedded)), key=lambda i: -float(scores[i]))
    ranked = [embedded[i] for i in order]
    ranked.extend(pid for pid in candidate_ids if pid not in vectors)
    return ranked
