import json

from django.core.management.base import BaseCommand, CommandError

from mls.services import openai_client
from mls.services.listing_embeddings import embed_pending


class Command(BaseCommand):
    help = (
        "Embed listings whose description changed since their last embedding "
        "(AI search 'best match' ordering). Safe to run after every DDF sync: "
        "unchanged listings are skipped without calling OpenAI."
    )

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None, help="Embed at most this many listings.")
        parser.add_argument("--batch-size", type=int, default=100, help="Listings per OpenAI request (max 2048).")

    def handle(self, *args, **options):
        if not openai_client.is_configured():
            raise CommandError("GEMINI_API_KEY is not set.")
        batch_size = options["batch_size"]
        if not 1 <= batch_size <= 2048:
            raise CommandError("--batch-size must be between 1 and 2048.")
        summary = embed_pending(limit=options["limit"], batch_size=batch_size)
        self.stdout.write(json.dumps(summary))
        if summary["failed"] and not summary["embedded"]:
            raise CommandError("Every embedding batch failed; see the log for the OpenAI error.")
