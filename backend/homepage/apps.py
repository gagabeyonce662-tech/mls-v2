from django.apps import AppConfig


class HomepageConfig(AppConfig):
    """Data behind the v3 homepage sections that the MLS feed alone can't serve.

    Two kinds of thing live here:

    * editorial content the business maintains in admin (buyer incentives,
      partners, community imagery, news sources), and
    * derived feeds computed from the listing data we already have — rental
      yield estimates, price-drop deals, repeat-sale losses, the GTA market
      snapshot — plus the subscriptions (newsletter, neighbour alerts) that
      turn homepage visitors into contactable leads.

    Kept out of ``mls`` deliberately: ``mls/views.py`` is already 3k+ lines,
    and nothing here is part of listing ingestion.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "homepage"
    verbose_name = "Homepage"
