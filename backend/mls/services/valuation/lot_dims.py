import re
from decimal import Decimal
from typing import Optional


def parse_lot_depth_from_dimensions(lot_size_dimensions: Optional[str]) -> Optional[Decimal]:
    """
    Parse depth from strings like '120 x 45 ft', '120x45', '45.5 X 100.2 m'.
    Returns the second numeric dimension when two are found; else None.
    """
    if not lot_size_dimensions or not str(lot_size_dimensions).strip():
        return None
    s = str(lot_size_dimensions).lower().replace("×", "x")
    nums = re.findall(r"\d+(?:\.\d+)?", s)
    if len(nums) >= 2:
        try:
            return Decimal(nums[1])
        except Exception:
            return None
    return None


def infer_lot_depth(
    lot_size_dimensions: Optional[str],
    lot_size_area: Optional[Decimal],
    frontage: Optional[Decimal],
) -> Optional[Decimal]:
    parsed = parse_lot_depth_from_dimensions(lot_size_dimensions)
    if parsed is not None:
        return parsed
    if lot_size_area and frontage and frontage > 0:
        try:
            return lot_size_area / frontage
        except Exception:
            return None
    return None
