class SectionedAdminMixin:
    """
    Compatibility mixin retained while the custom admin UI is disabled.

    Existing ModelAdmin classes still inherit from this class, but it no
    longer overrides Django's default change-form template or static assets.
    """

    pass
