from django.core.management.base import BaseCommand, CommandError

from mls.services.amplify_sold import run_amplify_sold_sync


class Command(BaseCommand):
    help = "Sync sold listing rows from Amplify RESO OData feed"

    def add_arguments(self, parser):
        parser.add_argument("--full", action="store_true", help="Ignore incremental cursor and run a full sync")
        parser.add_argument(
            "--max-pages",
            type=int,
            default=0,
            help="Safety cap for API pages during testing. 0 means no cap.",
        )
        parser.add_argument("--dry-run", action="store_true", help="Fetch and parse without writing DB rows")

    def handle(self, *args, **options):
        try:
            result = run_amplify_sold_sync(
                full_sync=bool(options.get("full")),
                max_pages=int(options.get("max_pages") or 0),
                dry_run=bool(options.get("dry_run")),
            )
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                "sync_amplify_sold complete: "
                f"fetched={result.fetched}, upserted={result.upserted}, skipped={result.skipped}, "
                f"watermark={result.watermark.isoformat() if result.watermark else 'none'}"
            )
        )
