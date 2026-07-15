import hashlib
import re
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from urllib.parse import urlparse

from django.utils.text import slugify

from .normalizers import normalize_money, normalize_percentage
from .schemas import (
    ParsedDepositPlan,
    ParsedEstateContent,
    ParsedItem,
    ParsedSection,
)


SECTION_KINDS = {
    "pricing": "prices",
    "price list": "prices",
    "prices": "prices",
    "unit types": "unit_types",
    "home types": "unit_types",
    "suite types": "unit_types",
    "deposit structure": "deposits",
    "deposit schedule": "deposits",
    "deposits": "deposits",
    "incentives": "incentives",
    "amenities": "amenities",
    "location highlights": "amenities",
    "floor plans": "documents",
    "documents": "documents",
    "downloads": "documents",
}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
DOCUMENT_PATTERN = re.compile(r"floor|brochure|price.?list|document|download|\.pdf(?:$|[?#])", re.I)


def _key(prefix: str, value: str) -> str:
    slug = slugify(value)[:120]
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}:{slug or digest}"[:255]


def _kind(heading: str) -> str | None:
    normalized = re.sub(r"\s+", " ", heading.strip(" /:-").lower())
    return next((value for label, value in SECTION_KINDS.items() if label in normalized), None)


class _RawCollector(HTMLParser):
    """Split HTML into exact top-level fragments without normalizing markup."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.fragments: list[tuple[str, str]] = []
        self._parts: list[str] = []
        self._root_tag = ""
        self._depth = 0

    def _append(self, value: str):
        if self._depth:
            self._parts.append(value)
        elif value:
            self.fragments.append(("", value))

    def _finish(self):
        self.fragments.append((self._root_tag, "".join(self._parts)))
        self._parts, self._root_tag, self._depth = [], "", 0

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        if not self._depth:
            self._root_tag, self._parts, self._depth = tag, [raw], 1
            if tag in VOID_TAGS:
                self._finish()
            return
        self._parts.append(raw)
        if tag not in VOID_TAGS:
            self._depth += 1

    def handle_startendtag(self, tag, attrs):
        self._append(self.get_starttag_text())

    def handle_endtag(self, tag):
        self._append(f"</{tag}>")
        if self._depth:
            self._depth -= 1
            if not self._depth:
                self._finish()

    def handle_data(self, data):
        self._append(data)

    def handle_entityref(self, name):
        self._append(f"&{name};")

    def handle_charref(self, name):
        self._append(f"&#{name};")

    def handle_comment(self, data):
        self._append(f"<!--{data}-->")

    def handle_decl(self, decl):
        self._append(f"<!{decl}>")

    def close(self):
        super().close()
        if self._parts:
            self._finish()


class _TextLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []
        self.links: list[tuple[str, str]] = []
        self._href = ""
        self._link_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href = dict(attrs).get("href", "")
            self._link_text = []
        elif tag in {"br", "td", "th"}:
            self.text.append(" | ")

    def handle_data(self, data):
        self.text.append(data)
        if self._href:
            self._link_text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            self.links.append((" ".join("".join(self._link_text).split()), self._href))
            self._href, self._link_text = "", []
        elif tag in {"p", "li", "tr", "div"}:
            self.text.append(" ")


class _Elements(HTMLParser):
    def __init__(self, tags):
        super().__init__(convert_charrefs=False)
        self.tags = set(tags)
        self.elements: list[str] = []
        self._parts: list[str] = []
        self._depth = 0

    def _append(self, value):
        if self._depth:
            self._parts.append(value)

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        if not self._depth and tag in self.tags:
            self._parts, self._depth = [raw], 1
        elif self._depth:
            self._parts.append(raw)
            if tag not in VOID_TAGS:
                self._depth += 1

    def handle_startendtag(self, tag, attrs):
        self._append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if not self._depth:
            return
        self._parts.append(f"</{tag}>")
        self._depth -= 1
        if not self._depth:
            self.elements.append("".join(self._parts))
            self._parts = []

    def handle_data(self, data):
        self._append(data)

    def handle_entityref(self, name):
        self._append(f"&{name};")

    def handle_charref(self, name):
        self._append(f"&#{name};")

    def handle_comment(self, data):
        self._append(f"<!--{data}-->")


def _text(fragment: str) -> str:
    parser = _TextLinks()
    parser.feed(fragment)
    return " ".join("".join(parser.text).replace("|  |", "|").split())


def _links(fragment: str) -> list[tuple[str, str]]:
    parser = _TextLinks()
    parser.feed(fragment)
    return parser.links


def _elements(fragment: str, tags) -> list[str]:
    parser = _Elements(tags)
    parser.feed(fragment)
    return parser.elements


def _valid_url(value: str) -> bool:
    parsed = urlparse(str(value or "").strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _trusted_numeric(value) -> Decimal | None:
    try:
        cleaned = str(value).replace(",", "").replace("$", "").strip()
        return Decimal(cleaned) if re.fullmatch(r"\d+(?:\.\d{1,2})?", cleaned) else None
    except (InvalidOperation, TypeError):
        return None


def _values(value) -> list[str]:
    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    if value is None or isinstance(value, dict):
        return []
    text = str(value).strip()
    return [text] if text else []


def _matching_unit(text: str, units: dict[str, ParsedItem], warnings: list[str]) -> str:
    normalized = text.lower()
    matches = [key for key, unit in units.items() if re.search(rf"\b{re.escape(unit.text.lower())}\b", normalized)]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        warnings.append(f"Ambiguous unit type association for: {text[:160]}")
    return ""


def _supporting_inputs(result: ParsedEstateContent, metadata, terms) -> dict[str, ParsedItem]:
    units: dict[str, ParsedItem] = {}
    meta = metadata if isinstance(metadata, dict) else {}
    taxonomy = terms if isinstance(terms, dict) else {}

    for value in _values(taxonomy.get("type") or taxonomy.get("property_type")):
        source_key = _key("taxonomy-unit", value)
        units[source_key] = ParsedItem(source_key, value)

    for value in _values(taxonomy.get("features") or taxonomy.get("property_features")):
        if re.search(r"incentive|discount|credit|bonus|cashback|upgrade", value, re.I):
            result.incentives.append(ParsedItem(_key("taxonomy-incentive", value), value))
        else:
            result.amenities.append(ParsedItem(_key("taxonomy-amenity", value), value))

    label_installments = []
    for value in _values(taxonomy.get("labels") or taxonomy.get("property_label")):
        amount, percentage = normalize_money(value), normalize_percentage(value)
        if amount is not None or percentage is not None:
            label_installments.append(ParsedItem(_key("taxonomy-deposit-item", value), value, amount, percentage, value))
        elif re.search(r"incentive|discount|credit|bonus", value, re.I):
            result.incentives.append(ParsedItem(_key("taxonomy-incentive", value), value))

    if label_installments:
        result.deposit_plans.append(ParsedDepositPlan("taxonomy-deposit-plan", "Deposit plan", tuple(label_installments)))

    unit_keys = {"unit_types", "home_types", "suite_types", "fave_property_type"}
    price_keys = {"fave_property_price", "sale_or_rent_price", "list_price", "starting_price"}
    for key, raw_value in meta.items():
        key_lower = str(key).lower()
        if key_lower in unit_keys:
            for value in _values(raw_value):
                source_key = _key(f"meta-unit-{key_lower}", value)
                units.setdefault(source_key, ParsedItem(source_key, value))
        elif key_lower in price_keys:
            for value in _values(raw_value):
                amount = normalize_money(value) or _trusted_numeric(value)
                if amount is None:
                    result.warnings.append(f"Ambiguous metadata price in {key_lower}: {value[:120]}")
                result.prices.append(ParsedItem(_key(f"meta-price-{key_lower}", value), value, amount, unit_type_key=_matching_unit(value, units, result.warnings)))
        elif re.search(r"deposit|signing", key_lower):
            installments = []
            for value in _values(raw_value):
                amount, percentage = normalize_money(value) or _trusted_numeric(value), normalize_percentage(value)
                if amount is None and percentage is None:
                    result.warnings.append(f"Ambiguous metadata deposit in {key_lower}: {value[:120]}")
                    continue
                installments.append(ParsedItem(_key(f"meta-deposit-{key_lower}", value), value, amount, percentage, key_lower.replace("_", " ")))
            if installments:
                result.deposit_plans.append(ParsedDepositPlan(_key("meta-deposit-plan", key_lower), key_lower.replace("_", " ").title(), tuple(installments)))
        elif re.search(r"brochure|floor.?plan|price.?list|document", key_lower):
            for value in _values(raw_value):
                if _valid_url(value):
                    result.documents.append(ParsedItem(_key("meta-document", value), key_lower.replace("_", " ").title(), url=value))
                else:
                    result.warnings.append(f"Unsupported document metadata in {key_lower} was preserved in the source snapshot.")

    result.unit_types.extend(units.values())
    return units


def parse_estate_content(raw_html: str, metadata=None, terms=None) -> ParsedEstateContent:
    result = ParsedEstateContent()
    units = _supporting_inputs(result, metadata, terms)
    collector = _RawCollector()
    collector.feed(raw_html or "")
    collector.close()

    heading = "Overview"
    kind = None
    heading_key = "overview"
    heading_occurrences: dict[str, int] = {}
    residual: list[str] = []
    deposits: list[ParsedItem] = []
    section_unit_key = ""

    def flush():
        nonlocal residual, deposits
        if residual and "".join(residual).strip():
            occurrence = heading_occurrences.get(heading_key, 0)
            result.sections.append(ParsedSection(f"html-section:{heading_key}:{occurrence}", heading, "".join(residual)))
        if deposits:
            occurrence = heading_occurrences.get(heading_key, 0)
            result.deposit_plans.append(ParsedDepositPlan(f"html-deposit-plan:{heading_key}:{occurrence}", heading or "Deposit plan", tuple(deposits), section_unit_key))
        residual, deposits = [], []

    seen_documents = {item.source_key for item in result.documents}
    counters: dict[str, int] = {}

    for root_tag, original_fragment in collector.fragments:
        fragment = original_fragment
        fragment_text = _text(fragment)
        if root_tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            flush()
            heading = fragment_text or "Overview"
            kind = _kind(heading)
            heading_key = slugify(heading)[:80] or "section"
            heading_occurrences[heading_key] = heading_occurrences.get(heading_key, -1) + 1
            section_unit_key = _matching_unit(heading, units, result.warnings)
            continue

        # Extract protected document anchors and remove only those exact anchors
        # from public residual HTML. Other links and all surrounding markup remain.
        for anchor in _elements(fragment, {"a"}):
            anchor_links = _links(anchor)
            if not anchor_links:
                continue
            label, url = anchor_links[0]
            if _valid_url(url) and DOCUMENT_PATTERN.search(f"{label} {url}"):
                source_key = _key("html-document", url)
                if source_key not in seen_documents:
                    result.documents.append(ParsedItem(source_key, label or "Document", url=url))
                    seen_documents.add(source_key)
                fragment = fragment.replace(anchor, "", 1)

        candidate_fragments = _elements(fragment, {"tr"}) or _elements(fragment, {"li"})
        candidates = candidate_fragments or ([fragment] if fragment_text.strip() else [])
        if not kind:
            residual.append(fragment)
            continue
        if kind == "documents":
            if _text(fragment).strip():
                residual.append(fragment)
                result.warnings.append(f"Unsupported document-section content preserved under '{heading}'.")
            continue

        parsed_items: list[ParsedItem] = []
        ambiguous = False
        for candidate in candidates:
            text = _text(candidate).strip(" |")
            if not text:
                continue
            if _links(candidate):
                ambiguous = True
                break
            parts = [part.strip() for part in re.split(r"\s*//+\s*", text) if part.strip()]
            if kind == "prices":
                display = " // ".join(parts)
                if not re.search(r"\$|\bCAD\b|\bfrom\b|\bstarting\b", display, re.I):
                    ambiguous = True
                    break
                amount = normalize_money(display)
                if amount is None:
                    result.warnings.append(f"Ambiguous price retained as display text: {display[:160]}")
                association = _matching_unit(display, units, result.warnings)
                counter_key = f"price:{heading_key}"
                counters[counter_key] = counters.get(counter_key, 0) + 1
                parsed_items.append(ParsedItem(_key(f"html-price-{heading_key}-{counters[counter_key]}", association or parts[0]), display, amount, unit_type_key=association))
            elif kind == "unit_types":
                for part in parts:
                    if re.search(r"\$|%", part) or len(part) > 180:
                        ambiguous = True
                        break
                    source_key = _key("html-unit", part)
                    item = ParsedItem(source_key, part)
                    if source_key not in units:
                        parsed_items.append(item)
                        units[source_key] = item
            elif kind == "deposits":
                amount, percentage = normalize_money(text), normalize_percentage(text)
                if amount is None and percentage is None:
                    ambiguous = True
                    break
                milestone = text.split(":", 1)[0].strip() if ":" in text else text
                counter_key = f"deposit:{heading_key}:{milestone}"
                counters[counter_key] = counters.get(counter_key, 0) + 1
                parsed_items.append(ParsedItem(_key(f"html-deposit-{heading_key}-{counters[counter_key]}", milestone), text, amount, percentage, milestone, unit_type_key=section_unit_key))
            elif kind in {"incentives", "amenities"}:
                if len(text) > 500:
                    ambiguous = True
                    break
                parsed_items.append(ParsedItem(_key(f"html-{kind[:-1]}", text), text))

        if ambiguous:
            residual.append(fragment)
            result.warnings.append(f"Ambiguous or unsupported {kind} content preserved under '{heading}'.")
            continue
        if kind == "deposits":
            deposits.extend(parsed_items)
        else:
            getattr(result, kind).extend(parsed_items)

    flush()
    if raw_html and not collector.fragments:
        result.sections.append(ParsedSection("html-section:overview:0", "Overview", raw_html))
        result.warnings.append("Source HTML could not be segmented and was preserved verbatim.")
    for field_name in ("unit_types", "prices", "incentives", "amenities", "documents"):
        values = getattr(result, field_name)
        setattr(result, field_name, list({item.source_key: item for item in values}.values()))
    return result
