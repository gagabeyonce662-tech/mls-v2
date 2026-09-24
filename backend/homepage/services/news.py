"""RSS / Atom ingestion for the "Daily real estate & financial news" section.

Parsing uses the standard library (``xml.etree``) rather than a new
dependency; RSS 2.0 and Atom are both handled, plus the two common image
conventions (``media:content`` / ``media:thumbnail`` and ``enclosure``).
Feeds are untrusted input: entity expansion is refused, text is stripped of
markup, and only http(s) links are kept.
"""

from __future__ import annotations

import html
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from email.utils import parsedate_to_datetime
from typing import Iterable
from xml.etree import ElementTree as ET

import requests
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = 10
MAX_ITEMS_PER_FEED = 30
SUMMARY_MAX = 400
USER_AGENT = "HomeAtlasNewsBot/1.0 (+homepage news section)"

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}
_TAGS = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"\s+")
_IMG_SRC = re.compile(r"<img[^>]+src=[\"']([^\"']+)", re.IGNORECASE)


@dataclass(frozen=True)
class FeedItem:
    title: str
    url: str
    summary: str
    image_url: str
    published_at: datetime


def _text(value: str | None) -> str:
    """Markup-free, entity-decoded, whitespace-collapsed text."""
    if not value:
        return ""
    return _SPACES.sub(" ", html.unescape(_TAGS.sub(" ", value))).strip()


def _http_url(value: str | None) -> str:
    value = (value or "").strip()
    return value if value.startswith(("https://", "http://")) else ""


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    value = value.strip()
    try:
        parsed = parsedate_to_datetime(value)  # RFC 822 (RSS)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))  # RFC 3339 (Atom)
        except ValueError:
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt_timezone.utc)


def _image(node: ET.Element, raw_html: str) -> str:
    for path in ("media:content", "media:thumbnail"):
        el = node.find(path, NS)
        if el is not None and _http_url(el.get("url")):
            medium = el.get("medium") or el.get("type") or "image"
            if "image" in medium or path == "media:thumbnail":
                return _http_url(el.get("url"))
    enclosure = node.find("enclosure")
    if enclosure is not None and (enclosure.get("type") or "").startswith("image/"):
        return _http_url(enclosure.get("url"))
    match = _IMG_SRC.search(raw_html or "")
    return _http_url(match.group(1)) if match else ""


def parse_feed(payload: bytes) -> list[FeedItem]:
    """Items from an RSS 2.0 or Atom document; malformed items are skipped."""
    if b"<!ENTITY" in payload[:4096]:
        # No DTD entity expansion (billion-laughs); legitimate feeds don't need it.
        raise ValueError("Feed declares entities; refusing to parse.")
    root = ET.fromstring(payload)

    nodes = root.findall("./channel/item") or root.findall("atom:entry", NS)
    items: list[FeedItem] = []
    for node in nodes[:MAX_ITEMS_PER_FEED]:
        is_atom = node.tag.endswith("entry")
        title = _text(node.findtext("atom:title" if is_atom else "title", default="", namespaces=NS))
        if is_atom:
            # Explicit None checks: an Element with no children is falsy, so
            # `a or b` would skip a perfectly good <link/>.
            link_el = node.find("atom:link[@rel='alternate']", NS)
            if link_el is None:
                link_el = node.find("atom:link", NS)
            url = _http_url(link_el.get("href") if link_el is not None else "")
            raw = node.findtext("atom:summary", default="", namespaces=NS) or node.findtext(
                "atom:content", default="", namespaces=NS
            )
            date_raw = node.findtext("atom:published", default="", namespaces=NS) or node.findtext(
                "atom:updated", default="", namespaces=NS
            )
        else:
            url = _http_url(node.findtext("link"))
            raw = node.findtext("description", default="") or node.findtext(
                "content:encoded", default="", namespaces=NS
            )
            date_raw = node.findtext("pubDate")
        published = _parse_date(date_raw)
        if not title or not url or not published:
            continue
        summary = _text(raw)
        if len(summary) > SUMMARY_MAX:
            summary = summary[: SUMMARY_MAX - 1].rsplit(" ", 1)[0] + "…"
        items.append(FeedItem(title[:300], url[:1000], summary, _image(node, raw)[:1000], published))
    return items


def ingest_source(source) -> int:
    """Fetch one ``NewsSource`` and upsert its items. Returns rows created."""
    from homepage.models import NewsArticle

    try:
        response = requests.get(source.feed_url, timeout=FETCH_TIMEOUT, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
        items = parse_feed(response.content)
    except (requests.RequestException, ET.ParseError, ValueError) as exc:
        source.last_error = str(exc)[:1000]
        source.last_fetched_at = timezone.now()
        source.save(update_fields=["last_error", "last_fetched_at"])
        logger.warning("News feed %s failed: %s", source.feed_url, exc)
        return 0

    created = 0
    with transaction.atomic():
        for item in items:
            _, was_created = NewsArticle.objects.get_or_create(
                url=item.url,
                defaults={
                    "source": source,
                    "title": item.title,
                    "summary": item.summary,
                    "image_url": item.image_url,
                    "tag": source.tag,
                    "published_at": item.published_at,
                },
            )
            created += int(was_created)
        source.last_error = ""
        source.last_fetched_at = timezone.now()
        source.save(update_fields=["last_error", "last_fetched_at"])
    return created


def ingest_all(sources: Iterable | None = None) -> dict[str, int]:
    from homepage.models import NewsSource

    results: dict[str, int] = {}
    for source in sources if sources is not None else NewsSource.objects.filter(is_active=True):
        results[source.name] = ingest_source(source)
    return results
