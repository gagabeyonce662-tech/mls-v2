from django.core.management.base import BaseCommand, CommandError

from mls.services.estate_project_import import (
    EstateProjectImporter,
    LegacyEstateNotFound,
)


class Command(BaseCommand):
    help = (
        "Idempotently import legacy WordPress estate rows into canonical "
        "estate projects."
    )

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--legacy-id", type=int)
        parser.add_argument("--limit", type=int)

    def handle(self, *args, **options):
        try:
            result = EstateProjectImporter().run(
                legacy_id=options["legacy_id"],
                limit=options["limit"],
                dry_run=options["dry_run"],
            )
        except LegacyEstateNotFound as exc:
            raise CommandError(str(exc)) from exc

        for failure in result.failures:
            self.stderr.write(failure)
        self.stdout.write(
            " ".join(
                f"{key}={value}" for key, value in result.totals.items()
            )
        )
