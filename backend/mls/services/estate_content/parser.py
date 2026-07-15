import html
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

from .normalizers import normalize_money, normalize_percentage
from .schemas import ParsedEstateContent, ParsedItem, ParsedSection


SECTION_KINDS = {
    "price": "prices", "pricing": "prices", "price list": "prices",
    "unit types": "unit_types", "home types": "unit_types", "suite types": "unit_types",
    "deposit": "deposits", "deposit structure": "deposits", "deposit schedule": "deposits",
    "incentive": "incentives", "incentives": "incentives",
    "amenities": "amenities", "location": "amenities", "location highlights": "amenities",
    "floor plans": "documents", "documents": "documents", "downloads": "documents",
}


class _Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.links = []
        self._tag = None
        self._text = []
        self._href = ""

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "tr"}:
            self._tag, self._text = tag, []
        if tag == "a":
            self._href = dict(attrs).get("href", "")

    def handle_data(self, data):
        if self._tag:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            label = " ".join("".join(self._text).split())
            self.links.append((label, self._href))
            self._href = ""
        if tag == self._tag:
            text = " ".join("".join(self._text).split())
            if text:
                self.blocks.append((tag, text))
            self._tag, self._text = None, []


def _kind(heading):
    normalized = re.sub(r"\s+", " ", heading.strip(" /:-").lower())
    return next((value for key, value in SECTION_KINDS.items() if key in normalized), None)


def parse_estate_content(raw_html: str, metadata=None, terms=None) -> ParsedEstateContent:
    result = ParsedEstateContent()
    parser = _Extractor()
    parser.feed(raw_html or "")
    current_heading, current_kind, prose = "Overview", None, []

    def flush():
        nonlocal prose
        if prose:
            rendered = "".join(f"<p>{html.escape(line)}</p>" for line in prose)
            result.sections.append(ParsedSection(current_heading, rendered))
            prose = []

    for tag, text in parser.blocks:
        parts = [p.strip() for p in re.split(r"\s*//+\s*", text) if p.strip()]
        for part in parts:
            if tag.startswith("h") or (len(part) < 80 and _kind(part)):
                flush()
                current_heading, current_kind = part, _kind(part)
                continue
            item = ParsedItem(part, normalize_money(part), normalize_percentage(part), part.split(":", 1)[0] if ":" in part else "")
            if current_kind:
                getattr(result, current_kind).append(item)
            else:
                prose.append(part)
    flush()

    seen_urls = set()
    for label, url in parser.links:
        if url in seen_urls or urlparse(url).scheme not in {"http", "https"}:
            continue
        seen_urls.add(url)
        if re.search(r"floor|brochure|price|download|\.pdf(?:$|\?)", f"{label} {url}", re.I):
            result.documents.append(ParsedItem(label or "Document", url=url))
    if raw_html and not parser.blocks:
        result.sections.append(ParsedSection("Overview", raw_html))
        result.warnings.append("Source HTML had no recognized block structure; preserved verbatim.")
    if any(item.amount is None for item in result.prices if "$" in item.text):
        result.warnings.append("One or more price expressions were ambiguous and remain display text only.")
    return result
