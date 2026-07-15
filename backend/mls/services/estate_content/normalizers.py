import re
from decimal import Decimal, InvalidOperation


def normalize_money(text: str) -> Decimal | None:
    """Normalize only an explicit, single dollar amount."""
    matches = re.findall(r"(?:CAD\s*)?\$\s*([\d,]+(?:\.\d{1,2})?)", text, re.I)
    if len(matches) != 1:
        return None
    try:
        return Decimal(matches[0].replace(",", ""))
    except InvalidOperation:
        return None


def normalize_percentage(text: str) -> Decimal | None:
    matches = re.findall(r"(?<!\d)(\d{1,3}(?:\.\d+)?)\s*%", text)
    if len(matches) != 1:
        return None
    value = Decimal(matches[0])
    return value if value <= 100 else None
