import re
from html import unescape

from django.core.management.base import BaseCommand

from vlog.models import VlogPost
from .convert_vlog_html_to_markdown import html_to_markdown, looks_like_html


def normalize_text(value: str, decode_entities: bool = True) -> str:
    if not value:
        return ""
    text = unescape(value) if decode_entities else value
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u00a0", " ")
    text = text.replace("\u2002", " ")
    text = text.replace("\u2003", " ")
    text = text.replace("\u2009", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    return text.strip()


def clean_markdown_content(value: str) -> str:
    # Decode entities so numeric entities become readable characters.
    text = normalize_text(value, decode_entities=True)
    if not text:
        return ""

    # If decoded text still contains HTML, convert it to markdown first.
    if looks_like_html(text):
        text = html_to_markdown(text)

    # Fix obvious malformed emphasis artifacts introduced by HTML conversion.
    text = re.sub(r"\*\*([^\n*]{0,2})\*\*", r"\1", text)  # tiny accidental bold chunks
    text = re.sub(r"([:;,.])\*\*", r"\1", text)  # punctuation followed by stray **
    text = re.sub(r"\*\*([:;,.])", r"\1", text)  # stray ** before punctuation
    text = re.sub(r"(?m)^\s*-\s+", "- ", text)  # normalize list bullets
    text = re.sub(r"\n{3,}", "\n\n", text)

    # If a line has unmatched bold markers, remove them to avoid rendering glitches.
    cleaned_lines = []
    for line in text.split("\n"):
        if line.count("**") % 2 != 0:
            line = line.replace("**", "")
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


class Command(BaseCommand):
    help = "Clean converted vlog markdown text (entities, spacing, simple markdown artifacts)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Preview changes only.")
        parser.add_argument("--slug", type=str, help="Clean a single post by slug.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        slug = options.get("slug")

        queryset = VlogPost.objects.all().order_by("id")
        if slug:
            queryset = queryset.filter(slug=slug)

        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No matching vlog posts found."))
            return

        changed = 0
        self.stdout.write(f"Cleaning {total} vlog post(s)...")

        for post in queryset.iterator():
            new_title = normalize_text(post.title or "", decode_entities=True)
            new_excerpt = normalize_text(post.excerpt or "", decode_entities=True)
            new_content = clean_markdown_content(post.content or "")

            dirty = (
                new_title != (post.title or "")
                or new_excerpt != (post.excerpt or "")
                or new_content != (post.content or "")
            )
            if not dirty:
                continue

            changed += 1
            if dry_run:
                self.stdout.write(self.style.SUCCESS(f"[DRY-RUN] Would clean: {post.slug}"))
                continue

            post.title = new_title
            post.excerpt = new_excerpt
            post.content = new_content
            post.save(update_fields=["title", "excerpt", "content", "updated_at"])
            self.stdout.write(self.style.SUCCESS(f"Cleaned: {post.slug}"))

        summary = f"Done. Changed={changed}, Unchanged={total - changed}, Total={total}"
        if dry_run:
            self.stdout.write(self.style.WARNING(f"{summary} [dry-run]"))
        else:
            self.stdout.write(self.style.SUCCESS(summary))
