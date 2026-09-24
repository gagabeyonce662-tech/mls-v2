"""Homepage models.

Editorial content (maintained in admin) and the subscription / derived-feed
tables behind the v3 homepage. See ``homepage/apps.py`` for the split.
"""

import secrets

from django.conf import settings
from django.db import models


def _token() -> str:
    """Unguessable token for one-click unsubscribe links (no login needed)."""
    return secrets.token_urlsafe(32)


class OrderedActiveModel(models.Model):
    """Shared shape for admin-curated lists: manual order + publish toggle."""

    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["display_order", "id"]


# --------------------------------------------------------------------------
# Editorial content
# --------------------------------------------------------------------------


class BuyerIncentive(OrderedActiveModel):
    """A buyer program (FHSA, land-transfer rebate, …) shown on the homepage.

    Government amounts change, so every row carries its source and the date a
    person last checked it; the API returns both so the UI can disclose them.
    """

    ICON_CHOICES = [
        ("home", "Home"),
        ("savings", "Savings"),
        ("green", "Green"),
        ("construction", "Construction"),
        ("equity", "Equity"),
        ("retirement", "Retirement"),
    ]

    title = models.CharField(max_length=160)
    label = models.CharField(max_length=80, blank=True, help_text="Short tag, e.g. 'First-time buyers'.")
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, default="home")
    amount_text = models.CharField(max_length=80, help_text="Display amount, e.g. 'Up to $40,000'.")
    description = models.TextField()
    source_url = models.URLField(blank=True)
    reviewed_at = models.DateField(null=True, blank=True, help_text="When the amount was last verified.")

    class Meta(OrderedActiveModel.Meta):
        verbose_name = "buyer incentive"

    def __str__(self) -> str:
        return self.title


class Partner(OrderedActiveModel):
    """A trusted connection (mortgage broker, lawyer, inspector, …)."""

    name = models.CharField(max_length=160)
    category = models.CharField(max_length=80, help_text="e.g. 'Mortgage', 'Legal', 'Inspection'.")
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    class Meta(OrderedActiveModel.Meta):
        verbose_name = "partner"

    def __str__(self) -> str:
        return f"{self.name} ({self.category})"


class CommunityImage(models.Model):
    """Photo for a community tile. Keyed by lower-cased city name — the same
    key the catalog-stats endpoints and the frontend's follow buttons use."""

    city_key = models.CharField(max_length=120, unique=True)
    city_label = models.CharField(max_length=120)
    image_url = models.URLField()
    credit = models.CharField(max_length=160, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["city_label"]

    def save(self, *args, **kwargs):
        self.city_key = self.city_key.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.city_label


class NewsSource(models.Model):
    """An RSS / Atom feed ingested into ``NewsArticle`` by ``ingest_news``."""

    name = models.CharField(max_length=120)
    feed_url = models.URLField(unique=True)
    tag = models.CharField(max_length=60, blank=True, help_text="Default tag, e.g. 'Mortgage Rates'.")
    is_active = models.BooleanField(default=True)
    last_fetched_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class NewsArticle(models.Model):
    source = models.ForeignKey(NewsSource, on_delete=models.CASCADE, related_name="articles")
    title = models.CharField(max_length=300)
    url = models.URLField(max_length=1000, unique=True)
    summary = models.TextField(blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    tag = models.CharField(max_length=60, blank=True)
    published_at = models.DateTimeField(db_index=True)
    is_hidden = models.BooleanField(default=False, help_text="Hide an off-topic item without deleting it.")
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self) -> str:
        return self.title


# --------------------------------------------------------------------------
# Subscriptions
# --------------------------------------------------------------------------


class NewsletterSubscriber(models.Model):
    """Newsletter opt-in with the evidence CASL requires.

    Canada's anti-spam law needs provable express consent: when, how, and what
    the person agreed to. ``consent_text`` stores the exact wording shown, and
    every email must carry the unsubscribe link built from ``token``.
    """

    email = models.EmailField(unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="newsletter_subscriptions",
    )
    consent_at = models.DateTimeField()
    consent_text = models.TextField()
    source = models.CharField(max_length=80, default="homepage")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    token = models.CharField(max_length=64, unique=True, default=_token, editable=False)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_subscribed(self) -> bool:
        return self.unsubscribed_at is None

    def __str__(self) -> str:
        return self.email


class NearbyAlert(models.Model):
    """"Tell me when my neighbours sell": new listings within a radius.

    Coordinates come from the frontend's existing geocoder, so the backend
    stores a point and never geocodes. ``last_notified_at`` is the high-water
    mark for the daily job — a listing is sent at most once per alert.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE,
        related_name="nearby_alerts",
    )
    email = models.EmailField()
    label = models.CharField(max_length=255, help_text="What the person typed, e.g. '12 Elm St, Oakville'.")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_km = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    consent_at = models.DateTimeField()
    consent_text = models.TextField(blank=True)
    token = models.CharField(max_length=64, unique=True, default=_token, editable=False)
    is_active = models.BooleanField(default=True)
    last_notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "last_notified_at"])]

    def __str__(self) -> str:
        return f"{self.email} · {self.label}"


# --------------------------------------------------------------------------
# Derived feeds (recomputed by jobs; the API only reads)
# --------------------------------------------------------------------------


class SoldBelowPurchase(models.Model):
    """A repeat sale that closed below the home's previous sale price.

    Computed from AMPRE closed history by ``compute_sold_below_purchase``;
    AMPRE retains roughly two years, so only resales inside that window are
    found. Rows are replaced wholesale on each run.
    """

    listing_key = models.CharField(max_length=64, unique=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=120, db_index=True)
    property_sub_type = models.CharField(max_length=120, blank=True)
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    close_price = models.DecimalField(max_digits=12, decimal_places=2)
    close_date = models.DateField()
    previous_close_price = models.DecimalField(max_digits=12, decimal_places=2)
    previous_close_date = models.DateField()
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-close_date"]

    @property
    def loss_amount(self):
        return self.previous_close_price - self.close_price

    def __str__(self) -> str:
        return self.address


class MarketSnapshot(models.Model):
    """Latest computed GTA (or per-city) market figures, one row per scope."""

    scope = models.CharField(max_length=60, unique=True, help_text="'gta' or a lower-cased city.")
    payload = models.JSONField()
    as_of = models.DateTimeField()

    def __str__(self) -> str:
        return f"{self.scope} @ {self.as_of:%Y-%m-%d %H:%M}"
