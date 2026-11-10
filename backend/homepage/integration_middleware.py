"""Apply admin-console connection values before a view reads settings."""

from homepage.runtime_config import apply_overlay


class IntegrationOverlayMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        apply_overlay()
        return self.get_response(request)
