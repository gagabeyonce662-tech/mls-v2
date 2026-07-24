from datetime import date, datetime, time
from decimal import Decimal

import pytz


NULL_VALUES = (None, "", "null")


def safe_decimal(value, default=None):
    if value in NULL_VALUES:
        return default

    try:
        return Decimal(str(value))
    except (TypeError, ValueError, ArithmeticError):
        return default


def safe_int(value, default=None):
    if value in NULL_VALUES:
        return default

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def safe_float(value, default=None):
    if value in NULL_VALUES:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_str(value, default=""):
    if value in NULL_VALUES:
        return default

    cleaned_value = str(value).strip()

    if cleaned_value in ("", "null"):
        return default

    return cleaned_value


def safe_list(value):
    if value in NULL_VALUES:
        return ""

    if not isinstance(value, (list, tuple, set)):
        return safe_str(value)

    return ", ".join(
        str(item).strip()
        for item in value
        if item not in NULL_VALUES and str(item).strip()
    )


def safe_bool(value):
    if value is True:
        return True

    if value is False:
        return False

    normalized_value = str(value).strip().lower()

    if normalized_value in ("true", "yes", "1", "y"):
        return True

    if normalized_value in ("false", "no", "0", "n"):
        return False

    return None


def safe_datetime(value):
    if value in NULL_VALUES:
        return None

    try:
        parsed_datetime = datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )

        return parsed_datetime.astimezone(pytz.UTC).replace(tzinfo=None)
    except (TypeError, ValueError):
        return None


def safe_date(value, default=None):
    if value in NULL_VALUES:
        return default

    try:
        return date.fromisoformat(
            str(value).split("T", 1)[0]
        )
    except (TypeError, ValueError):
        return default


def safe_time(value, default=None):
    if value in NULL_VALUES:
        return default

    try:
        return time.fromisoformat(str(value))
    except (TypeError, ValueError):
        return default