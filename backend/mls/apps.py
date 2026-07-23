from django.apps import AppConfig


class MlsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mls'

    def ready(self):
        # Register model hooks after Django has loaded the app registry.
        from . import signals  # noqa: F401
