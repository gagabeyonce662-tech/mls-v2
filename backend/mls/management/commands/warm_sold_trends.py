from django.core.management.base import BaseCommand

from mls.views_market import warm_sold_trends


class Command(BaseCommand):
    help = (
        "Rebuild the cached Market Trends sold data (each site city + GTA, 1/2/3-year windows) from AMPRE. "
        "Run every few hours from celery beat or cron; needs a shared cache (CACHE_URL)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--window", type=int, action="append", help="Window in months; repeatable. Default: 12, 24 and 36."
        )

    def handle(self, *args, **options):
        report = warm_sold_trends(options["window"]) if options["window"] else warm_sold_trends()
        self.stdout.write(self.style.SUCCESS(f"Warmed: {', '.join(report['ok']) or 'none'}"))
        for label, error in report["failed"].items():
            self.stderr.write(f"Failed {label}: {error}")
