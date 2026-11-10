from django.core.management.base import BaseCommand

from mls.services.saved_search_alerts import send_saved_search_alerts


class Command(BaseCommand):
    help = "Email new listings for saved searches whose daily/weekly alert is due."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Find matches without sending email or moving the alert cursor.",
        )

    def handle(self, *args, **options):
        report = send_saved_search_alerts(dry_run=bool(options.get("dry_run")))
        self.stdout.write(self.style.SUCCESS(str(report)))
