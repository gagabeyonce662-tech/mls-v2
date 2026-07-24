from django.core.management.base import BaseCommand

from mls.helpers import get_access_token
from mls.services.ddf.open_house_cache import refresh_open_house_cache


class Command(BaseCommand):
    help = "Refresh the Redis cache containing CREA DDF Open Houses."

    def handle(self, *args, **options):
        self.stdout.write("Refreshing Open House cache...")

        token = get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
        }

        result = refresh_open_house_cache(
            headers=headers,
            progress_callback=self.stdout.write,
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Open House cache refreshed: "
                f"{result['cached_count']} events cached, "
                f"{result['skipped_missing_property']} unavailable."
            )
        )