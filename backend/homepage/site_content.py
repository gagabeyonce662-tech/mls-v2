"""Schema, defaults, and validation for the admin site console.

The public homepage, header, and footer keep their designed layout. This module
only accepts the copy, images, links, order, and visibility an admin may change,
and rejects values that would overflow or break those layouts.

Keep the limits aligned with ``lib/site/validate.ts`` in mls-v3-frontend.
"""

from __future__ import annotations

from urllib.parse import urlparse

SCHEMA_VERSION = 1
KEYS = ("homepage", "chrome", "seo", "curated")
CURATED_GROUPS = ("Deals", "By price", "By type", "Rentals", "By city")
CURATED_TYPES = ("Detached", "Semi-Detached", "Townhome", "Condo", "Luxury")
CURATED_TRANSACTIONS = ("sale", "rent")
HERO_IMAGE = "/images/hero/hero-bg.jpg"

QUICK_ICONS = {"buy", "rent", "precon", "sell"}
TYPE_ICONS = {"detached", "condo", "townhome", "luxury", "openHouse", "rental"}
ADVANTAGE_ICONS = {"mls", "precon", "local", "guidance"}
SOCIALS = ("facebook", "instagram", "youtube", "x", "linkedin")

SECTION_IDS = (
    "hero",
    "quickActions",
    "trendingCommunities",
    "featuredListings",
    "propertyTypes",
    "newPrecon",
    "todaysNew",
    "highReturn",
    "marketDeals",
    "soldBelow",
    "schools",
    "incentives",
    "marketIntelligence",
    "neighbourAlerts",
    "alertsCta",
    "thinkingOfSelling",
    "whyHomeAtlas",
    "research",
    "partners",
    "howItWorks",
    "dailyNews",
    "resources",
    "keywords",
)


def _link(label: str, href: str) -> dict:
    return {"label": label, "href": href}


def default_documents() -> dict[str, dict]:
    """Copy that matches the hardcoded site, so the first publish looks unchanged."""
    return {
        "homepage": {"sections": _default_sections()},
        "chrome": _default_chrome(),
        "seo": {
            "title": "HomeAtlas — GTA Real Estate Intelligence",
            "description": (
                "Search active MLS® listings across the Greater Toronto Area, "
                "track market trends, and get an instant home valuation."
            ),
            "shareImageUrl": "",
            "shareImageAlt": "",
        },
        # Empty pages → public site keeps the code defaults in mls-v3 curatedPages.
        "curated": {"pages": []},
    }


def _default_sections() -> list[dict]:
    hero_desc = (
        "Search live MLS® listings, discover pre-construction projects, compare "
        "communities, and make informed decisions with real market data and "
        "trusted local expertise."
    )
    return [
        {
            "id": "hero",
            "visible": True,
            "content": {
                "imageUrl": HERO_IMAGE,
                "imageAlt": "Toronto skyline",
                "focalX": 60,
                "scrim": 55,
                "eyebrow": "GTA property intelligence",
                "lines": ["Real Estate,", "Made", "Remarkably", "Smarter."],
                "accentLine": 3,
                "description": hero_desc,
                "tryPrompts": [
                    "3 bed condo under $900K near a subway in Toronto",
                    "Family home in Oakville with a big backyard and double garage",
                    "2 bedroom rental downtown under $3,000/month with parking",
                    "Detached house in Vaughan with a basement apartment",
                ],
            },
        },
        {
            "id": "quickActions",
            "visible": True,
            "content": {
                "items": [
                    {"icon": "buy", "label": "Buy", "description": "Browse MLS® listings", "href": "/listings?status=Active"},
                    {"icon": "rent", "label": "Rent", "description": "Find rental homes", "href": "/listings?tx=rent"},
                    {"icon": "precon", "label": "Preconstruction", "description": "Invest early", "href": "/preconstruction"},
                    {"icon": "sell", "label": "Sell", "description": "Request a home valuation", "href": "/sell"},
                ]
            },
        },
        {"id": "trendingCommunities", "visible": True, "content": {"eyebrow": "Discover the GTA", "title": "Trending Communities", "actionLabel": "View All", "actionHref": "/communities"}},
        {"id": "featuredListings", "visible": True, "content": {"eyebrow": "Curated for you", "title": "Featured MLS® Listings", "description": "Hand-picked homes from the HomeAtlas team.", "useAutomaticDescription": True, "actionLabel": "View All Listings", "actionHref": "/listings"}},
        {
            "id": "propertyTypes",
            "visible": True,
            "content": {
                "title": "Explore by Property Type",
                "items": [
                    {"icon": "detached", "label": "Detached", "href": "/listings?type=Detached"},
                    {"icon": "condo", "label": "Condos", "href": "/listings?type=Condo"},
                    {"icon": "townhome", "label": "Townhomes", "href": "/listings?type=Townhome"},
                    {"icon": "luxury", "label": "Luxury", "href": "/listings?priceMin=2000000"},
                    {"icon": "openHouse", "label": "Open Houses", "href": "/listings?openHouse=1"},
                    {"icon": "rental", "label": "Rentals", "href": "/listings?tx=rent"},
                ],
            },
        },
        {"id": "newPrecon", "visible": True, "content": {"eyebrow": "Invest ahead", "title": "New Preconstruction Projects", "actionLabel": "View All Projects", "actionHref": "/preconstruction"}},
        {"id": "todaysNew", "visible": True, "content": {"eyebrow": "Live", "title": "Today's New Listings", "actionLabel": "View All", "actionHref": "/listings?sort=newest"}},
        {"id": "highReturn", "visible": True, "content": {"eyebrow": "For investors", "title": "High Return Properties", "description": "Top rental yield opportunities in the GTA — strong cash flow potential", "caption": "Estimated from asking rents of comparable rentals; excludes financing.", "actionLabel": "View All Investor Properties", "actionHref": "/listings"}},
        {"id": "marketDeals", "visible": True, "content": {"eyebrow": "Exclusive opportunities", "title": "GTA Market Deals", "caption": "Largest recent price reductions on active GTA listings"}},
        {"id": "soldBelow", "visible": True, "content": {"eyebrow": "Buyer's opportunity", "title": "Sold Below Last Purchase", "description": "Properties that recently sold below their previous purchase price — potential value opportunities", "actionLabel": "View All Sold Data", "actionHref": "/listings?status=Sold"}},
        {
            "id": "schools",
            "visible": True,
            "content": {
                "eyebrow": "Schools & families",
                "title": "GTA Secondary Schools",
                "description": "Published EQAO results for GTA secondary schools. These are school locations, not attendance boundaries.",
                "items": [
                    {"name": "Westmount Collegiate", "community": "Toronto", "rating": 9.2, "listings": 48, "imageUrl": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop", "imageAlt": "House exterior", "href": "/listings?city=Toronto"},
                    {"name": "Thornlea Secondary", "community": "Markham", "rating": 8.9, "listings": 32, "imageUrl": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop", "imageAlt": "House exterior", "href": "/listings?city=Markham"},
                    {"name": "White Oaks Secondary", "community": "Oakville", "rating": 8.7, "listings": 27, "imageUrl": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop", "imageAlt": "House exterior", "href": "/listings?city=Oakville"},
                    {"name": "St. Brother André", "community": "Vaughan", "rating": 8.5, "listings": 41, "imageUrl": "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=800&h=500&fit=crop", "imageAlt": "House exterior", "href": "/listings?city=Vaughan"},
                ],
            },
        },
        {"id": "incentives", "visible": True, "content": {"eyebrow": "Maximize your savings", "title": "Buyer's Incentives", "description": "Explore government programs and financial incentives available to GTA homebuyers. Choose from multiple options that apply to your situation."}},
        {"id": "marketIntelligence", "visible": True, "content": {"eyebrow": "Know before you move", "title": "Market Intelligence,\nMade Useful."}},
        {
            "id": "neighbourAlerts",
            "visible": True,
            "content": {
                "eyebrow": "For renters & neighbours",
                "title": "When Your Neighbours\nAre Selling",
                "description": "Stay informed about listings near you. Whether you're renting and your landlord is selling, or you're a homeowner tracking your street's value — HomeAtlas keeps you in the loop with instant alerts when nearby homes hit the market.",
                "bullets": [
                    "Get alerted when a home near you is listed or sold",
                    "Renters: know if your building or street is for sale",
                    "Track your neighbourhood's price movement",
                    "First-look at properties before they go live",
                ],
                "whatsappMessage": "Hi, I'd like to know when homes near me are listed.",
            },
        },
        {
            "id": "alertsCta",
            "visible": True,
            "content": {
                "eyebrow": "Stay ahead of the market",
                "title": "Smart alerts",
                "description": "Follow an area and we'll tell you when homes are listed, when prices move, and when they sell. Manage everything from your saved homes at any time.",
                "alerts": [
                    {"key": "newListings", "label": "New listings", "description": "Be first to see new properties in this area"},
                    {"key": "priceChanges", "label": "Price drops", "description": "Get notified when asking prices fall"},
                    {"key": "statusUpdates", "label": "Status updates", "description": "Know when a home sells or is de-listed"},
                ],
            },
        },
        {
            "id": "thinkingOfSelling",
            "visible": True,
            "content": {
                "eyebrow": "Maximize your value",
                "title": "Thinking of Selling?",
                "description": "Get a free home valuation in minutes. Our GTA specialists combine market data with local knowledge to get you the best possible price.",
                "primaryLabel": "Get Free Valuation",
                "primaryHref": "/home-evaluation",
                "secondaryLabel": "Learn More",
                "secondaryHref": "/sell",
                "imageUrl": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=900&fit=crop",
                "imageAlt": "A bright living room",
            },
        },
        {
            "id": "whyHomeAtlas",
            "visible": True,
            "content": {
                "eyebrow": "Our advantage",
                "title": "Why Choose HomeAtlas",
                "items": [
                    {"icon": "mls", "title": "MLS Access", "description": "2,300+ daily-updated MLS listings across the entire GTA, with full data transparency."},
                    {"icon": "precon", "title": "Preconstruction Experts", "description": "First access to new developments with insider pricing and VIP release notifications."},
                    {"icon": "local", "title": "Local Market Knowledge", "description": "Neighbourhood-level data, school ratings, and community insights built in."},
                    {"icon": "guidance", "title": "Personalized Guidance", "description": "Tailored recommendations + dedicated agents who know the GTA inside out."},
                ],
            },
        },
        {
            "id": "research",
            "visible": True,
            "content": {
                "eyebrow": "Data & research",
                "title": "Research & Insights",
                "description": "Explore useful real estate insights and data for the GTA",
                "items": [
                    {"title": "Price Trends", "description": "Find property rates & price trends for top GTA locations.", "imageUrl": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop", "imageAlt": "Market chart", "href": "/market-trends"},
                    {"title": "City Insights", "description": "Get to know GTA communities before you invest.", "imageUrl": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop", "imageAlt": "City skyline", "href": "/communities"},
                    {"title": "Housing Research", "description": "Find reports on the GTA residential real estate market.", "imageUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop", "imageAlt": "Research desk", "href": "/blog"},
                ],
            },
        },
        {"id": "partners", "visible": True, "content": {"eyebrow": "Your real estate network", "title": "Trusted Connections for\nYour Journey", "description": "We connect you with top-tier professionals to ensure every aspect of your real estate experience is seamless, secure, and exceptional."}},
        {
            "id": "howItWorks",
            "visible": True,
            "content": {
                "eyebrow": "Simple & fast",
                "title": "How it works",
                "description": "Finding, buying, or selling a home in the GTA has never been easier. HomeAtlas guides you every step of the way.",
                "whatsappMessage": "Hi, I'd like some help finding, buying or selling a home in the GTA.",
                "insightsLabel": "View property insights",
                "insightsHref": "/market-trends",
                "steps": [
                    {"title": "Create your free HomeAtlas account", "description": "Set up your preferences, search criteria, and start receiving personalized listing alerts matched to your needs."},
                    {"title": "Discover your perfect GTA property", "description": "Browse 2,300+ daily-updated MLS listings with detailed search, interactive map, and community insights — all in one place."},
                    {"title": "Close with confidence", "description": "Connect with top-rated GTA agents, get expert market guidance, legal support, and full transparency on sold prices and market trends."},
                ],
            },
        },
        {"id": "dailyNews", "visible": True, "content": {"eyebrow": "Stay informed", "title": "Daily Real Estate & Financial News", "description": "Latest updates on GTA market, mortgage rates, and investment trends", "actionLabel": "All News", "actionHref": "/blog", "newsletterTitle": "Get Daily Market Updates in Your Inbox", "newsletterDescription": "GTA market news, rate changes, and investment opportunities — every morning."}},
        {
            "id": "resources",
            "visible": True,
            "content": {
                "eyebrow": "Learn more",
                "title": "Resources & Guides",
                "actionLabel": "View All",
                "actionHref": "/blog",
                "items": [
                    {"tag": "Buy", "title": "The GTA Buying Guide", "description": "Everything first-time buyers need to know about purchasing in the GTA.", "href": "/blog"},
                    {"tag": "Insights", "title": "Market Insights", "description": "Monthly analysis of pricing trends, DOM stats, and neighbourhood reports.", "href": "/market-trends"},
                    {"tag": "Explore", "title": "Neighbourhood Need Guide", "description": "A deep dive into each GTA community: schools, transit, lifestyle.", "href": "/communities"},
                    {"tag": "Sell", "title": "Selling in 2025", "description": "How to price, stage, and sell your home for maximum value this year.", "href": "/sell"},
                ],
            },
        },
        {"id": "keywords", "visible": True, "content": {"eyebrow": "Popular searches", "title": "Search by keywords"}},
    ]


def _default_chrome() -> dict:
    return {
        "announcement": {
            "items": [
                {"text": "New pre-construction projects released this week", "label": "View projects", "href": "/preconstruction"},
                {"text": "MLS® listings updated daily across the GTA", "label": "", "href": ""},
                {"text": "Track price movements in your neighbourhood", "label": "See trends", "href": "/market-trends"},
                {"text": "Free, no-obligation home evaluation", "label": "Get your estimate", "href": "/home-evaluation"},
                {"text": "VIP pre-construction access before public launch", "label": "", "href": ""},
            ]
        },
        "nav": {
            "links": [
                _link("Buy", "/listings?status=Active"),
                _link("Rent", "/listings?tx=rent"),
                _link("Preconstruction", "/preconstruction"),
                _link("Assignments", "/assignments"),
                _link("Sell", "/sell"),
                _link("Market Insights", "/market-trends"),
                _link("Communities", "/communities"),
            ],
            "ctaLabel": "Home Evaluation",
            "ctaHref": "/home-evaluation",
        },
        "footer": {
            "bannerEyebrow": "Still looking?",
            "bannerHeading": "Let our team find your perfect home.",
            "bannerLabel": "Browse all listings",
            "bannerHref": "/listings",
            "blurb": "HomeAtlas is a real estate intelligence platform providing GTA home valuations and market data.",
            "socials": [
                {"network": "facebook", "href": "https://www.facebook.com/estate4uprec/"},
                {"network": "instagram", "href": "https://www.instagram.com/estate4uprec/"},
                {"network": "youtube", "href": "https://www.youtube.com/channel/UC7g87rmbTk4N8v5n4QAGfWw"},
            ],
            "columns": [
                {"heading": "Explore", "links": [_link("Buy a home", "/listings?status=Active"), _link("Rentals", "/listings?tx=rent"), _link("Preconstruction", "/preconstruction"), _link("Assignments", "/assignments"), _link("Map search", "/map-search"), _link("Recently sold", "/recently-sold"), _link("Communities", "/communities")]},
                {"heading": "Sell", "links": [_link("Home evaluation", "/home-evaluation"), _link("Sell with us", "/sell"), _link("Market trends", "/market-trends")]},
                {"heading": "Popular searches", "links": [_link("Power of sale", "/homes/power-of-sale"), _link("Detached under $1M", "/homes/detached-under-1m"), _link("Condos under $500K", "/homes/condos-under-500k"), _link("Luxury homes", "/homes/luxury-homes"), _link("Open houses", "/homes/open-houses"), _link("Condos for rent", "/homes/condos-for-rent")]},
                {"heading": "Company", "links": [_link("Saved homes", "/watched"), _link("Compare homes", "/compare"), _link("Blog", "/blog"), _link("Sitemap", "/site-map")]},
            ],
        },
        "contact": _default_contact(),
    }


def _default_contact() -> dict:
    return {
        "whatsapp": "14168214200",
        "name": "Gunneet Singh",
        "title": "REALTOR® | HomeAtlas",
        "email": "info@estate-4u.com",
        "phones": [
            {"label": "Direct", "display": "+1 (416) 821-4200"},
            {"label": "Sales", "display": "+1 (647) 515-2000"},
        ],
        "address": "115 Matheson Blvd W, Unit 102, Mississauga L5R 1C6",
        "mapUrl": "https://maps.app.goo.gl/UCdgZUYWUuVkrRAe9",
        "hours": [
            {"days": "Monday – Friday", "hours": "9:00 AM – 7:00 PM"},
            {"days": "Saturday", "hours": "10:00 AM – 5:00 PM"},
            {"days": "Sunday", "hours": "By appointment"},
        ],
    }


class SiteValidationError(Exception):
    def __init__(self, fields: dict[str, list[str]]):
        self.fields = fields
        super().__init__("Fix the highlighted fields before saving.")


def validate_document(key: str, document: object) -> dict:
    """Return a cleaned document, or raise SiteValidationError."""
    errors: dict[str, list[str]] = {}
    if key not in KEYS:
        raise SiteValidationError({"key": ["Unknown document."]})
    if not isinstance(document, dict):
        raise SiteValidationError({"": ["The document must be an object."]})
    if key == "homepage":
        cleaned = _homepage(document, errors)
    elif key == "chrome":
        cleaned = _chrome(document, errors)
    elif key == "seo":
        cleaned = _seo(document, errors)
    else:
        cleaned = _curated(document, errors)
    if errors:
        raise SiteValidationError(errors)
    return cleaned


def _err(errors: dict, path: str, message: str) -> None:
    errors.setdefault(path, []).append(message)


def _text(value, path: str, errors: dict, max_len: int, *, required: bool = True) -> str:
    if not isinstance(value, str):
        _err(errors, path, "Enter text.")
        return ""
    text = " ".join(value.split()) if "\n" not in value else value.strip()
    if required and not text:
        _err(errors, path, "This field is required.")
    if len(text) > max_len:
        _err(errors, path, f"Keep this to {max_len} characters or fewer so the layout holds.")
    return text


def _multiline(value, path: str, errors: dict, max_len: int, max_lines: int = 2) -> str:
    if not isinstance(value, str):
        _err(errors, path, "Enter text.")
        return ""
    text = value.strip()
    lines = [line.strip() for line in text.split("\n")]
    if not text:
        _err(errors, path, "This field is required.")
    if len(lines) > max_lines:
        _err(errors, path, f"Use at most {max_lines} lines.")
    if len(text) > max_len:
        _err(errors, path, f"Keep this to {max_len} characters or fewer so the layout holds.")
    return "\n".join(lines)


def _link_value(value, path: str, errors: dict, *, allow_empty: bool = False) -> str:
    if not isinstance(value, str):
        _err(errors, path, "Enter a link.")
        return ""
    href = value.strip()
    if not href and allow_empty:
        return ""
    if not href:
        _err(errors, path, "Enter a link.")
        return ""
    if len(href) > 300:
        _err(errors, path, "This link is too long.")
        return href
    if href.startswith("/") and not href.startswith("//") and "\\" not in href and " " not in href:
        return href
    parsed = urlparse(href)
    if parsed.scheme == "https" and parsed.netloc:
        return href
    _err(errors, path, "Use a site path starting with / or a full https link.")
    return href


def _int(value, path: str, errors: dict, lo: int, hi: int) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _err(errors, path, "Enter a number.")
        return lo
    number = int(value) if isinstance(value, int) or float(value).is_integer() else None
    if number is None or number < lo or number > hi:
        _err(errors, path, f"Use a number from {lo} to {hi}.")
        return lo
    return number


def _number(value, path: str, errors: dict, lo: float, hi: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _err(errors, path, "Enter a number.")
        return lo
    number = float(value)
    if number < lo or number > hi:
        _err(errors, path, f"Use a number from {lo} to {hi}.")
        return lo
    return round(number, 1)


def _enum(value, path: str, errors: dict, allowed: set[str]) -> str:
    if value not in allowed:
        _err(errors, path, "Choose one of the available options.")
        return next(iter(allowed))
    return value


def _items(value, path: str, errors: dict, lo: int, hi: int) -> list:
    if not isinstance(value, list):
        _err(errors, path, "Add at least one item.")
        return []
    if len(value) < lo or len(value) > hi:
        _err(errors, path, f"Use between {lo} and {hi} items so the row still fits.")
    return value


def _obj(value) -> dict:
    return value if isinstance(value, dict) else {}


def _rail(content: dict, path: str, errors: dict, *, description: bool = False, caption: bool = False) -> dict:
    cleaned = {
        "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
        "title": _text(content.get("title"), f"{path}.title", errors, 60),
        "actionLabel": _text(content.get("actionLabel"), f"{path}.actionLabel", errors, 32),
        "actionHref": _link_value(content.get("actionHref"), f"{path}.actionHref", errors),
    }
    if description:
        cleaned["description"] = _text(content.get("description"), f"{path}.description", errors, 180)
    if caption:
        cleaned["caption"] = _text(content.get("caption"), f"{path}.caption", errors, 160)
    return cleaned


def _homepage(document: dict, errors: dict) -> dict:
    raw_sections = document.get("sections")
    if not isinstance(raw_sections, list):
        _err(errors, "sections", "Sections are missing.")
        return {"sections": []}
    by_id = {}
    order: list[str] = []
    for index, raw in enumerate(raw_sections):
        if not isinstance(raw, dict):
            _err(errors, f"sections.{index}", "This section is not valid.")
            continue
        section_id = raw.get("id")
        if section_id not in SECTION_IDS:
            _err(errors, f"sections.{index}.id", "Unknown section.")
            continue
        if section_id in by_id:
            _err(errors, f"sections.{index}.id", "This section is listed twice.")
            continue
        order.append(section_id)
        visible = True if section_id == "hero" else bool(raw.get("visible", True))
        if section_id == "hero" and raw.get("visible") is False:
            _err(errors, "sections.hero.visible", "The hero stays on the page. Hide a section below it instead.")
        content = _section_content(section_id, _obj(raw.get("content")), f"sections.{section_id}", errors)
        by_id[section_id] = {"id": section_id, "visible": visible, "content": content}
    missing = [section_id for section_id in SECTION_IDS if section_id not in by_id]
    if missing:
        _err(errors, "sections", "Every homepage section must be included, even hidden ones.")
    return {"sections": [by_id[section_id] for section_id in order if section_id in by_id]}


def _section_content(section_id: str, content: dict, path: str, errors: dict) -> dict:
    if section_id == "hero":
        lines = content.get("lines")
        cleaned_lines = []
        if not isinstance(lines, list):
            _err(errors, f"{path}.lines", "Add the heading lines.")
        else:
            if not 1 <= len(lines) <= 4:
                _err(errors, f"{path}.lines", "Use 1 to 4 heading lines.")
            for index, line in enumerate(lines[:4]):
                cleaned_lines.append(_text(line, f"{path}.lines.{index}", errors, 22))
        accent = content.get("accentLine", -1)
        if not isinstance(accent, int) or isinstance(accent, bool) or accent < -1 or accent >= max(len(cleaned_lines), 1):
            _err(errors, f"{path}.accentLine", "Pick one heading line for the gold accent, or none.")
            accent = -1
        return {
            "imageUrl": _link_value(content.get("imageUrl"), f"{path}.imageUrl", errors),
            "imageAlt": _text(content.get("imageAlt"), f"{path}.imageAlt", errors, 140),
            "focalX": _int(content.get("focalX"), f"{path}.focalX", errors, 0, 100),
            "scrim": _int(content.get("scrim"), f"{path}.scrim", errors, 40, 70),
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "lines": cleaned_lines,
            "accentLine": accent,
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
        }
    if section_id == "quickActions":
        items = _items(content.get("items"), f"{path}.items", errors, 2, 6)
        return {"items": [_card(item, f"{path}.items.{i}", errors, icon=QUICK_ICONS) for i, item in enumerate(items[:6])]}
    if section_id in {"trendingCommunities", "newPrecon", "todaysNew"}:
        return _rail(content, path, errors)
    if section_id == "featuredListings":
        rail = _rail(content, path, errors, description=True)
        rail["useAutomaticDescription"] = bool(content.get("useAutomaticDescription", True))
        return rail
    if section_id == "propertyTypes":
        items = _items(content.get("items"), f"{path}.items", errors, 2, 6)
        return {
            "title": _text(content.get("title"), f"{path}.title", errors, 60),
            "items": [
                {
                    "icon": _enum(_obj(item).get("icon"), f"{path}.items.{i}.icon", errors, TYPE_ICONS),
                    "label": _text(_obj(item).get("label"), f"{path}.items.{i}.label", errors, 24),
                    "href": _link_value(_obj(item).get("href"), f"{path}.items.{i}.href", errors),
                }
                for i, item in enumerate(items[:6])
            ],
        }
    if section_id == "highReturn":
        return _rail(content, path, errors, description=True, caption=True)
    if section_id == "marketDeals":
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 60),
            "caption": _text(content.get("caption"), f"{path}.caption", errors, 160),
        }
    if section_id == "soldBelow":
        return _rail(content, path, errors, description=True)
    if section_id == "schools":
        items = _items(content.get("items"), f"{path}.items", errors, 1, 6)
        cleaned = []
        for i, item in enumerate(items[:6]):
            row = _obj(item)
            cleaned.append({
                "name": _text(row.get("name"), f"{path}.items.{i}.name", errors, 60),
                "community": _text(row.get("community"), f"{path}.items.{i}.community", errors, 40),
                "rating": _number(row.get("rating"), f"{path}.items.{i}.rating", errors, 0, 10),
                "listings": _int(row.get("listings"), f"{path}.items.{i}.listings", errors, 0, 9999),
                "imageUrl": _link_value(row.get("imageUrl"), f"{path}.items.{i}.imageUrl", errors),
                "imageAlt": _text(row.get("imageAlt"), f"{path}.items.{i}.imageAlt", errors, 140),
                "href": _link_value(row.get("href"), f"{path}.items.{i}.href", errors),
            })
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 60),
            "description": _text(content.get("description"), f"{path}.description", errors, 160),
            "items": cleaned,
        }
    if section_id == "incentives":
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 60),
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
        }
    if section_id == "marketIntelligence":
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _multiline(content.get("title"), f"{path}.title", errors, 80),
        }
    if section_id == "neighbourAlerts":
        bullets = _items(content.get("bullets"), f"{path}.bullets", errors, 1, 6)
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _multiline(content.get("title"), f"{path}.title", errors, 80),
            "description": _text(content.get("description"), f"{path}.description", errors, 280),
            "bullets": [_text(bullet, f"{path}.bullets.{i}", errors, 90) for i, bullet in enumerate(bullets[:6])],
            "whatsappMessage": _text(content.get("whatsappMessage"), f"{path}.whatsappMessage", errors, 180),
        }
    if section_id == "alertsCta":
        alerts = content.get("alerts")
        keys = ["newListings", "priceChanges", "statusUpdates"]
        cleaned = []
        if not isinstance(alerts, list) or [(_obj(a).get("key")) for a in alerts] != keys:
            _err(errors, f"{path}.alerts", "Keep the three alert types. You can edit their labels.")
        else:
            for i, item in enumerate(alerts):
                row = _obj(item)
                cleaned.append({
                    "key": keys[i],
                    "label": _text(row.get("label"), f"{path}.alerts.{i}.label", errors, 28),
                    "description": _text(row.get("description"), f"{path}.alerts.{i}.description", errors, 80),
                })
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 40),
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
            "alerts": cleaned,
        }
    if section_id == "thinkingOfSelling":
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 48),
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
            "primaryLabel": _text(content.get("primaryLabel"), f"{path}.primaryLabel", errors, 32),
            "primaryHref": _link_value(content.get("primaryHref"), f"{path}.primaryHref", errors),
            "secondaryLabel": _text(content.get("secondaryLabel"), f"{path}.secondaryLabel", errors, 32),
            "secondaryHref": _link_value(content.get("secondaryHref"), f"{path}.secondaryHref", errors),
            "imageUrl": _link_value(content.get("imageUrl"), f"{path}.imageUrl", errors),
            "imageAlt": _text(content.get("imageAlt"), f"{path}.imageAlt", errors, 140),
        }
    if section_id == "whyHomeAtlas":
        items = _items(content.get("items"), f"{path}.items", errors, 2, 6)
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 48),
            "items": [
                {
                    "icon": _enum(_obj(item).get("icon"), f"{path}.items.{i}.icon", errors, ADVANTAGE_ICONS),
                    "title": _text(_obj(item).get("title"), f"{path}.items.{i}.title", errors, 40),
                    "description": _text(_obj(item).get("description"), f"{path}.items.{i}.description", errors, 140),
                }
                for i, item in enumerate(items[:6])
            ],
        }
    if section_id == "research":
        items = _items(content.get("items"), f"{path}.items", errors, 1, 4)
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 48),
            "description": _text(content.get("description"), f"{path}.description", errors, 160),
            "items": [_image_card(item, f"{path}.items.{i}", errors) for i, item in enumerate(items[:4])],
        }
    if section_id == "partners":
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _multiline(content.get("title"), f"{path}.title", errors, 80),
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
        }
    if section_id == "howItWorks":
        steps = _items(content.get("steps"), f"{path}.steps", errors, 2, 4)
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 40),
            "description": _text(content.get("description"), f"{path}.description", errors, 220),
            "whatsappMessage": _text(content.get("whatsappMessage"), f"{path}.whatsappMessage", errors, 180),
            "insightsLabel": _text(content.get("insightsLabel"), f"{path}.insightsLabel", errors, 40),
            "insightsHref": _link_value(content.get("insightsHref"), f"{path}.insightsHref", errors),
            "steps": [
                {
                    "title": _text(_obj(step).get("title"), f"{path}.steps.{i}.title", errors, 70),
                    "description": _text(_obj(step).get("description"), f"{path}.steps.{i}.description", errors, 180),
                }
                for i, step in enumerate(steps[:4])
            ],
        }
    if section_id == "dailyNews":
        rail = _rail(content, path, errors, description=True)
        rail["newsletterTitle"] = _text(content.get("newsletterTitle"), f"{path}.newsletterTitle", errors, 70)
        rail["newsletterDescription"] = _text(content.get("newsletterDescription"), f"{path}.newsletterDescription", errors, 160)
        return rail
    if section_id == "resources":
        items = _items(content.get("items"), f"{path}.items", errors, 1, 6)
        return {
            "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
            "title": _text(content.get("title"), f"{path}.title", errors, 48),
            "actionLabel": _text(content.get("actionLabel"), f"{path}.actionLabel", errors, 32),
            "actionHref": _link_value(content.get("actionHref"), f"{path}.actionHref", errors),
            "items": [
                {
                    "tag": _text(_obj(item).get("tag"), f"{path}.items.{i}.tag", errors, 16),
                    "title": _text(_obj(item).get("title"), f"{path}.items.{i}.title", errors, 48),
                    "description": _text(_obj(item).get("description"), f"{path}.items.{i}.description", errors, 140),
                    "href": _link_value(_obj(item).get("href"), f"{path}.items.{i}.href", errors),
                }
                for i, item in enumerate(items[:6])
            ],
        }
    return {
        "eyebrow": _text(content.get("eyebrow"), f"{path}.eyebrow", errors, 40),
        "title": _text(content.get("title"), f"{path}.title", errors, 48),
    }


def _card(item, path: str, errors: dict, *, icon: set[str]) -> dict:
    row = _obj(item)
    return {
        "icon": _enum(row.get("icon"), f"{path}.icon", errors, icon),
        "label": _text(row.get("label"), f"{path}.label", errors, 24),
        "description": _text(row.get("description"), f"{path}.description", errors, 48),
        "href": _link_value(row.get("href"), f"{path}.href", errors),
    }


def _image_card(item, path: str, errors: dict) -> dict:
    row = _obj(item)
    return {
        "title": _text(row.get("title"), f"{path}.title", errors, 40),
        "description": _text(row.get("description"), f"{path}.description", errors, 140),
        "imageUrl": _link_value(row.get("imageUrl"), f"{path}.imageUrl", errors),
        "imageAlt": _text(row.get("imageAlt"), f"{path}.imageAlt", errors, 140),
        "href": _link_value(row.get("href"), f"{path}.href", errors),
    }


def _pair(item, path: str, errors: dict, *, label_max: int = 40, allow_empty_href: bool = False) -> dict:
    row = _obj(item)
    label = _text(row.get("label"), f"{path}.label", errors, label_max, required=not allow_empty_href)
    href = _link_value(row.get("href"), f"{path}.href", errors, allow_empty=allow_empty_href or not label)
    if bool(label) != bool(href):
        _err(errors, path, "A link needs both a label and an address, or leave both blank.")
    return {"label": label, "href": href}


def _email(value, path: str, errors: dict) -> str:
    if not isinstance(value, str):
        _err(errors, path, "Enter an email address.")
        return ""
    email = value.strip()
    if not email:
        return ""
    if len(email) > 120 or email.count("@") != 1 or " " in email:
        _err(errors, path, "Enter a valid email address.")
    return email


def _detail_rows(value, path: str, errors: dict, defaults: list, *, limit: int, fields: tuple) -> list:
    if value is None:
        return [dict(row) for row in defaults]
    if not isinstance(value, list):
        _err(errors, path, "Add the rows for this section.")
        return [dict(row) for row in defaults]
    if len(value) > limit:
        _err(errors, path, f"Use at most {limit} rows.")
    cleaned = []
    for i, item in enumerate(value[:limit]):
        row = _obj(item)
        parsed = {}
        for key, max_len in fields:
            raw = row.get(key)
            parsed[key] = _text(raw if isinstance(raw, str) else "", f"{path}.{i}.{key}", errors, max_len, required=False)
        if any(parsed.values()):
            if not all(parsed.values()):
                _err(errors, f"{path}.{i}", "Fill in every part of the row, or leave the whole row blank.")
            cleaned.append(parsed)
    return cleaned


def _company_contact(contact: dict, errors: dict, whatsapp: str) -> dict:
    defaults = _default_contact()

    def text_field(key: str, max_len: int) -> str:
        if key not in contact:
            return defaults[key]
        raw = contact.get(key)
        return _text(raw if isinstance(raw, str) else "", f"contact.{key}", errors, max_len, required=False)

    if "mapUrl" not in contact:
        map_url = defaults["mapUrl"]
    else:
        raw_map = contact.get("mapUrl")
        map_url = "" if not isinstance(raw_map, str) or not raw_map.strip() else _link_value(raw_map, "contact.mapUrl", errors, allow_empty=True)
    email = defaults["email"] if "email" not in contact else _email(contact.get("email"), "contact.email", errors)
    return {
        "whatsapp": whatsapp,
        "name": text_field("name", 80),
        "title": text_field("title", 80),
        "email": email,
        "phones": _detail_rows(
            contact.get("phones") if "phones" in contact else None,
            "contact.phones",
            errors,
            defaults["phones"],
            limit=2,
            fields=(("label", 24), ("display", 40)),
        ),
        "address": text_field("address", 160),
        "mapUrl": map_url,
        "hours": _detail_rows(
            contact.get("hours") if "hours" in contact else None,
            "contact.hours",
            errors,
            defaults["hours"],
            limit=4,
            fields=(("days", 40), ("hours", 40)),
        ),
    }


def _chrome(document: dict, errors: dict) -> dict:
    announcement = _obj(document.get("announcement"))
    items = _items(announcement.get("items"), "announcement.items", errors, 1, 6)
    nav = _obj(document.get("nav"))
    links = _items(nav.get("links"), "nav.links", errors, 2, 8)
    footer = _obj(document.get("footer"))
    socials = _items(footer.get("socials"), "footer.socials", errors, 0, 5)
    columns = _items(footer.get("columns"), "footer.columns", errors, 1, 4)
    contact = _obj(document.get("contact"))
    whatsapp = contact.get("whatsapp")
    digits = "".join(ch for ch in str(whatsapp or "") if ch.isdigit())
    if not 10 <= len(digits) <= 15:
        _err(errors, "contact.whatsapp", "Enter a WhatsApp number with country code, digits only.")
    cleaned_socials = []
    seen = set()
    for i, item in enumerate(socials[:5]):
        row = _obj(item)
        network = row.get("network")
        if network not in SOCIALS or network in seen:
            _err(errors, f"footer.socials.{i}.network", "Choose Facebook, Instagram, YouTube, X, or LinkedIn once each.")
            continue
        seen.add(network)
        href = _link_value(row.get("href"), f"footer.socials.{i}.href", errors, allow_empty=True)
        if href and not href.startswith("https://"):
            _err(errors, f"footer.socials.{i}.href", "Social links must start with https://.")
        cleaned_socials.append({"network": network, "href": href})
    cleaned_columns = []
    for i, column in enumerate(columns[:4]):
        row = _obj(column)
        column_links = _items(row.get("links"), f"footer.columns.{i}.links", errors, 1, 8)
        cleaned_columns.append({
            "heading": _text(row.get("heading"), f"footer.columns.{i}.heading", errors, 24),
            "links": [_pair(link, f"footer.columns.{i}.links.{j}", errors) for j, link in enumerate(column_links[:8])],
        })
    return {
        "announcement": {
            "items": [
                {
                    "text": _text(_obj(item).get("text"), f"announcement.items.{i}.text", errors, 90),
                    **_pair(item, f"announcement.items.{i}", errors, label_max=28, allow_empty_href=True),
                }
                for i, item in enumerate(items[:6])
            ]
        },
        "nav": {
            "links": [_pair(link, f"nav.links.{i}", errors, label_max=24) for i, link in enumerate(links[:8])],
            "ctaLabel": _text(nav.get("ctaLabel"), "nav.ctaLabel", errors, 28),
            "ctaHref": _link_value(nav.get("ctaHref"), "nav.ctaHref", errors),
        },
        "footer": {
            "bannerEyebrow": _text(footer.get("bannerEyebrow"), "footer.bannerEyebrow", errors, 40),
            "bannerHeading": _text(footer.get("bannerHeading"), "footer.bannerHeading", errors, 80),
            "bannerLabel": _text(footer.get("bannerLabel"), "footer.bannerLabel", errors, 32),
            "bannerHref": _link_value(footer.get("bannerHref"), "footer.bannerHref", errors),
            "blurb": _text(footer.get("blurb"), "footer.blurb", errors, 280),
            "socials": cleaned_socials,
            "columns": cleaned_columns,
        },
        "contact": _company_contact(contact, errors, digits),
    }


def _seo(document: dict, errors: dict) -> dict:
    image = document.get("shareImageUrl") or ""
    alt = document.get("shareImageAlt") or ""
    if not isinstance(image, str):
        image = ""
    image = image.strip()
    if image:
        image = _link_value(image, "shareImageUrl", errors)
        alt = _text(alt, "shareImageAlt", errors, 140)
    elif alt:
        _err(errors, "shareImageAlt", "Add an image before alt text, or clear the alt text.")
    return {
        "title": _text(document.get("title"), "title", errors, 70),
        "description": _text(document.get("description"), "description", errors, 160),
        "shareImageUrl": image,
        "shareImageAlt": alt if image else "",
    }


def _curated(document: dict, errors: dict) -> dict:
    """Keyword / curated listing searches edited in Studio."""
    import re

    raw_pages = document.get("pages")
    if raw_pages is None:
        raw_pages = []
    if not isinstance(raw_pages, list):
        _err(errors, "pages", "Pages must be a list.")
        return {"pages": []}
    if len(raw_pages) > 80:
        _err(errors, "pages", "Keep this to 80 searches or fewer.")

    cleaned_pages: list[dict] = []
    seen_slugs: set[str] = set()
    for index, item in enumerate(raw_pages):
        path = f"pages.{index}"
        if not isinstance(item, dict):
            _err(errors, path, "Each search must be an object.")
            continue
        slug = _text(item.get("slug"), f"{path}.slug", errors, 80)
        if slug and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            _err(errors, f"{path}.slug", "Use lowercase letters, numbers, and hyphens only.")
        if slug in seen_slugs:
            _err(errors, f"{path}.slug", "Each slug must be unique.")
        if slug:
            seen_slugs.add(slug)

        group = item.get("group")
        if group not in CURATED_GROUPS:
            _err(errors, f"{path}.group", "Pick a group.")
            group = "Deals"

        query_raw = item.get("query") if isinstance(item.get("query"), dict) else {}
        query = _curated_query(query_raw, f"{path}.query", errors)
        enabled = item.get("enabled")
        if not isinstance(enabled, bool):
            enabled = True

        cleaned_pages.append(
            {
                "slug": slug,
                "label": _text(item.get("label"), f"{path}.label", errors, 60),
                "h1": _text(item.get("h1"), f"{path}.h1", errors, 100),
                "description": _text(item.get("description"), f"{path}.description", errors, 240),
                "group": group,
                "query": query,
                "enabled": enabled,
            }
        )
    return {"pages": cleaned_pages}


def _curated_query(query: dict, path: str, errors: dict) -> dict:
    status = query.get("status")
    status_text = ""
    if status is not None and status != "":
        status_text = _text(status, f"{path}.status", errors, 40, required=False)

    transaction = query.get("transaction")
    if transaction in (None, ""):
        transaction_out = None
    elif transaction in CURATED_TRANSACTIONS:
        transaction_out = transaction
    else:
        _err(errors, f"{path}.transaction", "Choose sale or rent.")
        transaction_out = None

    type_value = query.get("type")
    if type_value in (None, ""):
        type_out = None
    elif type_value in CURATED_TYPES:
        type_out = type_value
    else:
        _err(errors, f"{path}.type", "Pick a property type.")
        type_out = None

    def _opt_int(key: str, minimum: int = 0) -> int | None:
        value = query.get(key)
        if value in (None, ""):
            return None
        try:
            number = int(value)
        except (TypeError, ValueError):
            _err(errors, f"{path}.{key}", "Enter a whole number.")
            return None
        if number < minimum:
            _err(errors, f"{path}.{key}", f"Must be at least {minimum}.")
            return None
        return number

    keywords_raw = query.get("keywords")
    keywords: list[str] = []
    if isinstance(keywords_raw, list):
        for i, word in enumerate(keywords_raw):
            if not isinstance(word, str):
                _err(errors, f"{path}.keywords.{i}", "Enter text.")
                continue
            cleaned = " ".join(word.split())
            if not cleaned:
                continue
            if len(cleaned) > 80:
                _err(errors, f"{path}.keywords.{i}", "Keep each keyword to 80 characters or fewer.")
            keywords.append(cleaned)
        if len(keywords) > 20:
            _err(errors, f"{path}.keywords", "Use at most 20 keyword phrases.")
            keywords = keywords[:20]
    elif keywords_raw not in (None, ""):
        _err(errors, f"{path}.keywords", "Keywords must be a list.")

    city = query.get("city")
    city_out = _text(city, f"{path}.city", errors, 80, required=False) if city not in (None, "") else None

    open_house = query.get("openHouse")
    if not isinstance(open_house, bool):
        open_house = False

    out: dict = {}
    if status_text:
        out["status"] = status_text
    if transaction_out:
        out["transaction"] = transaction_out
    if type_out:
        out["type"] = type_out
    price_min = _opt_int("priceMin")
    price_max = _opt_int("priceMax")
    beds_min = _opt_int("bedsMin")
    if price_min is not None:
        out["priceMin"] = price_min
    if price_max is not None:
        out["priceMax"] = price_max
    if beds_min is not None:
        out["bedsMin"] = beds_min
    if city_out:
        out["city"] = city_out
    if keywords:
        out["keywords"] = keywords
    if open_house:
        out["openHouse"] = True
    return out
