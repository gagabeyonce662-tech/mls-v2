from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class ParsedItem:
    text: str
    amount: Decimal | None = None
    percentage: Decimal | None = None
    milestone: str = ""
    url: str = ""


@dataclass(frozen=True)
class ParsedSection:
    heading: str
    html: str


@dataclass
class ParsedEstateContent:
    sections: list[ParsedSection] = field(default_factory=list)
    unit_types: list[ParsedItem] = field(default_factory=list)
    prices: list[ParsedItem] = field(default_factory=list)
    deposits: list[ParsedItem] = field(default_factory=list)
    incentives: list[ParsedItem] = field(default_factory=list)
    amenities: list[ParsedItem] = field(default_factory=list)
    documents: list[ParsedItem] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
