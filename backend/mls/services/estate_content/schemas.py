from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class ParsedItem:
    source_key: str
    text: str
    amount: Decimal | None = None
    percentage: Decimal | None = None
    milestone: str = ""
    url: str = ""
    unit_type_key: str = ""


@dataclass(frozen=True)
class ParsedSection:
    source_key: str
    heading: str
    html: str


@dataclass(frozen=True)
class ParsedDepositPlan:
    source_key: str
    title: str
    installments: tuple[ParsedItem, ...]
    unit_type_key: str = ""


@dataclass
class ParsedEstateContent:
    sections: list[ParsedSection] = field(default_factory=list)
    unit_types: list[ParsedItem] = field(default_factory=list)
    prices: list[ParsedItem] = field(default_factory=list)
    deposit_plans: list[ParsedDepositPlan] = field(default_factory=list)
    incentives: list[ParsedItem] = field(default_factory=list)
    amenities: list[ParsedItem] = field(default_factory=list)
    documents: list[ParsedItem] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
