import json

from django.core.management.base import BaseCommand, CommandError

from homepage.services import jobs, news, subscriptions
from homepage.services.feeds import refresh_market_snapshot

JOBS = {
    "news": news.ingest_all,
    "market": lambda: bool(refresh_market_snapshot()),
    "sold-below": jobs.refresh_sold_below_purchase,
    "nearby-alerts": subscriptions.send_nearby_alerts,
}


class Command(BaseCommand):
    help = (
        "Refresh homepage feeds. With no --only, runs every job (news ingest, "
        "market snapshot, sold-below-purchase, nearby alerts). Intended for cron "
        "where no Celery worker runs."
    )

    def add_arguments(self, parser):
        parser.add_argument("--only", choices=sorted(JOBS), action="append", help="Run just these jobs.")

    def handle(self, *args, **options):
        selected = options.get("only")
        if not selected:
            results = jobs.run_all()
        else:
            results = {}
            for name in selected:
                try:
                    results[name] = JOBS[name]()
                except Exception as exc:  # noqa: BLE001
                    raise CommandError(f"{name} failed: {exc}") from exc
        self.stdout.write(json.dumps(results, indent=2, default=str))
