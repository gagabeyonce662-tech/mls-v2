"""On-site assistant (scope #25).

Answers are limited to a snapshot of this site: a few active listings in a
named city, published pre-construction projects, approved assignments, and
the public pages the site actually has. The model cannot be given the open
web, and every link it returns is checked against that page list.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from urllib.parse import urlsplit

from mls.models import Content, ListingSubmission, PreComProperty, Property
from mls.services.openai_client import OpenAIError, chat, is_configured, search_model

logger = logging.getLogger(__name__)

MAX_QUESTION_CHARS = 500

CITIES = (
    "Toronto",
    "Mississauga",
    "Vaughan",
    "Markham",
    "Brampton",
    "Oakville",
    "Burlington",
    "Hamilton",
)

# Paths the assistant may link to. Anything else is dropped.
ALLOWED_PREFIXES = (
    "/listings",
    "/property",
    "/map-search",
    "/market-trends",
    "/preconstruction",
    "/assignments",
    "/home-evaluation",
    "/sell",
    "/blog",
    "/communities",
    "/watched",
    "/recently-sold",
)

PAGES = [
    {"label": "Search listings", "href": "/listings", "about": "Active MLS listings by city, price, beds and type."},
    {"label": "Map search", "href": "/map-search", "about": "Listings on a map, including a drawn search area."},
    {"label": "Market trends", "href": "/market-trends", "about": "Sold prices, days on market and sale-to-list by city."},
    {"label": "Pre-construction", "href": "/preconstruction", "about": "New developer projects, floor plans and pricing."},
    {"label": "Assignments", "href": "/assignments", "about": "Pre-construction contracts offered for assignment."},
    {"label": "Home evaluation", "href": "/home-evaluation", "about": "An estimate from nearby comparable sales."},
    {"label": "List a property", "href": "/sell", "about": "Start a listing or upload an assignment."},
    {"label": "Blog", "href": "/blog", "about": "Guides and market articles."},
    {"label": "Communities", "href": "/communities", "about": "City-by-city listing snapshots."},
    {"label": "Saved homes", "href": "/watched", "about": "Favourites, notes and email alerts. Sign-in required."},
]

HANDOFFS = {"none", "whatsapp", "contact"}

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "answer": {"type": "string"},
        "links": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string"},
                    "href": {"type": "string"},
                },
                "required": ["label", "href"],
            },
        },
        "handoff": {"type": "string", "enum": ["none", "whatsapp", "contact"]},
    },
    "required": ["answer", "links", "handoff"],
}

SYSTEM = (
    "You are the HomeAtlas site assistant for Greater Toronto Area real estate. "
    "Answer ONLY from the JSON context you are given. Do not invent prices, "
    "addresses, school ratings or legal advice. If the context does not contain "
    "the answer, say so in one sentence and point to the closest page. "
    "links must use href values from the pages list or from a listing, project "
    "or assignment href in the context. At most 3 links. "
    "Set handoff to whatsapp when the person wants to talk to a person now, "
    "contact when they want an agent to follow up, otherwise none. "
    "Keep the answer under 120 words."
)


@dataclass
class AssistResult:
    answer: str
    links: list[dict] = field(default_factory=list)
    handoff: str = "none"
    fallback: bool = False
    error: str = ""
    model: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0

    def as_response(self) -> dict:
        return {
            "answer": self.answer,
            "links": self.links,
            "handoff": self.handoff,
            "fallback": self.fallback,
        }


def _city_in(question: str) -> str | None:
    lowered = question.lower()
    for city in CITIES:
        if city.lower() in lowered:
            return city
    return None


def _safe_href(href: str) -> str | None:
    raw = (href or "").strip()
    if not raw.startswith("/") or raw.startswith("//"):
        return None
    parts = urlsplit(raw)
    if parts.scheme or parts.netloc:
        return None
    path = parts.path.rstrip("/") or "/"
    allowed = any(path == prefix or path.startswith(prefix + "/") for prefix in ALLOWED_PREFIXES)
    if not allowed:
        return None
    query = f"?{parts.query}" if parts.query else ""
    return f"{path}{query}"[:300]


def _clean_links(links) -> list[dict]:
    cleaned = []
    if not isinstance(links, list):
        return cleaned
    for item in links[:3]:
        if not isinstance(item, dict):
            continue
        href = _safe_href(str(item.get("href") or ""))
        label = str(item.get("label") or "").strip()[:80]
        if href and label:
            cleaned.append({"label": label, "href": href})
    return cleaned


def site_context(question: str) -> dict:
    """A small, real snapshot. Failures become empty lists, never invented rows."""
    context: dict = {"pages": PAGES}
    city = _city_in(question)
    if city:
        try:
            qs = Property.objects.filter(standard_status__iexact="Active", city__iexact=city)
            rows = list(
                qs.order_by("-modification_timestamp").values(
                    "listing_key", "unparsed_address", "city", "list_price", "bedrooms_total"
                )[:5]
            )
            context["active_listings"] = {
                "city": city,
                "sample": [
                    {
                        "address": row["unparsed_address"] or "",
                        "city": row["city"] or city,
                        "list_price": float(row["list_price"]) if row["list_price"] is not None else None,
                        "beds": row["bedrooms_total"],
                        "href": f"/property/{row['listing_key']}",
                    }
                    for row in rows
                    if row.get("listing_key")
                ],
                "note": "Sample of active listings currently in the catalogue, not a complete count.",
            }
        except Exception:
            logger.exception("assist listing context failed")
            context["active_listings"] = {"city": city, "sample": []}

    try:
        projects = (
            PreComProperty.objects.filter(content__status=Content.PUBLISH)
            .select_related("content")
            .order_by("-is_featured", "content__title")[:6]
        )
        context["preconstruction"] = [
            {
                "title": project.content.title,
                "city": "",
                "href": f"/preconstruction/{project.pk}-{project.content.slug}",
            }
            for project in projects
        ]
    except Exception:
        logger.exception("assist precon context failed")
        context["preconstruction"] = []

    try:
        assignments = ListingSubmission.objects.filter(
            status=ListingSubmission.Status.APPROVED,
            purpose=ListingSubmission.Purpose.ASSIGNMENT,
        ).order_by("-submitted_at")[:5]
        context["assignments"] = [
            {
                "address": f"{row.address_line_1}, {row.city}",
                "asking_price": float(row.asking_price) if row.asking_price is not None else None,
                "href": f"/assignments/{row.pk}",
            }
            for row in assignments
        ]
    except Exception:
        logger.exception("assist assignment context failed")
        context["assignments"] = []

    return context


def _keyword_links(question: str) -> list[dict]:
    text = question.lower()
    picks = []
    rules = (
        (("condo", "house", "listing", "bed", "buy", "rent"), PAGES[0]),
        (("map",), PAGES[1]),
        (("market", "trend", "sold", "price"), PAGES[2]),
        (("pre-con", "precon", "floor plan", "developer"), PAGES[3]),
        (("assignment",), PAGES[4]),
        (("value", "valuation", "worth", "estimate"), PAGES[5]),
        (("sell", "list my"), PAGES[6]),
        (("blog", "article", "news"), PAGES[7]),
    )
    for words, page in rules:
        if any(word in text for word in words):
            picks.append({"label": page["label"], "href": page["href"]})
    if not picks:
        picks.append({"label": PAGES[0]["label"], "href": PAGES[0]["href"]})
    return picks[:3]


def _fallback(question: str, error: str = "") -> AssistResult:
    return AssistResult(
        answer=(
            "I can point you to the right page on this site. "
            "For a person, use WhatsApp or the contact form on Market trends."
        ),
        links=_keyword_links(question),
        handoff="contact",
        fallback=True,
        error=error,
    )


def answer_question(question: str) -> AssistResult:
    question = question.strip()[:MAX_QUESTION_CHARS]
    if not is_configured():
        return _fallback(question, "GEMINI_API_KEY is not configured.")

    context = site_context(question)
    started = time.monotonic()
    try:
        result = chat(
            [
                {"role": "system", "content": SYSTEM},
                {
                    "role": "user",
                    "content": json.dumps({"question": question, "context": context}, default=str),
                },
            ],
            model=search_model(),
            json_schema=SCHEMA,
            schema_name="assist",
            max_tokens=500,
            timeout=20,
        )
    except OpenAIError as exc:
        logger.warning("ai assist fallback: %s", exc)
        fallback = _fallback(question, str(exc)[:500])
        fallback.latency_ms = int((time.monotonic() - started) * 1000)
        return fallback

    latency_ms = int((time.monotonic() - started) * 1000)
    try:
        payload = json.loads(result.content)
    except json.JSONDecodeError:
        fallback = _fallback(question, "Model reply was not JSON.")
        fallback.latency_ms = latency_ms
        fallback.model = result.model
        return fallback

    handoff = payload.get("handoff") if payload.get("handoff") in HANDOFFS else "none"
    answer = str(payload.get("answer") or "").strip()[:1500]
    if not answer:
        fallback = _fallback(question, "Model reply had an empty answer.")
        fallback.latency_ms = latency_ms
        return fallback

    return AssistResult(
        answer=answer,
        links=_clean_links(payload.get("links")),
        handoff=handoff,
        fallback=False,
        model=result.model,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
        latency_ms=latency_ms,
    )
