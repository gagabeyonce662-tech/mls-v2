from datetime import date

from django.core.management.base import BaseCommand

from mls.services.newsletter_notifications import send_daily_listing_newsletters


class Command(BaseCommand):
    help = "Send daily listing newsletters based on watched preferences."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            dest="digest_date",
            default="",
            help="Digest date in YYYY-MM-DD format. Defaults to today in server timezone.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Compute and persist skip records without sending outbound emails.",
        )
        parser.add_argument(
            "--user-limit",
            type=int,
            default=0,
            help="Optional cap for number of users to process.",
        )

    def handle(self, *args, **options):
        digest_date_str = (options.get("digest_date") or "").strip()
        digest_date = None
        if digest_date_str:
            digest_date = date.fromisoformat(digest_date_str)

        result = send_daily_listing_newsletters(
            digest_date=digest_date,
            dry_run=bool(options.get("dry_run")),
            user_limit=options.get("user_limit") or None,
        )
        self.stdout.write(self.style.SUCCESS(str(result)))
