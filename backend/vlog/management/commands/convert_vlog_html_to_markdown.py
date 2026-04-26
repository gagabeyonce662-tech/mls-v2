import re
from html import unescape

from django.core.management.base import BaseCommand

from vlog.models import VlogPost


def html_to_markdown(html_content: str) -> str:
    """Convert common rich-text HTML into markdown."""
    if not html_content:
        return ""

    text = html_content.replace("\r\n", "\n").replace("\r", "\n")

    # Remove scripts/styles/comments first.
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style.*?>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)

    # Headings.
    for level in range(6, 0, -1):
        text = re.sub(
            rf"<h{level}[^>]*>(.*?)</h{level}>",
            lambda m: f"\n{'#' * level} {clean_inline_tags(m.group(1))}\n\n",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        )

    # Links and images.
    text = re.sub(
        r"<a[^>]*href=[\"'](.*?)[\"'][^>]*>(.*?)</a>",
        lambda m: f"[{clean_inline_tags(m.group(2)).strip()}]({m.group(1).strip()})",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(
        r"<img[^>]*alt=[\"'](.*?)[\"'][^>]*src=[\"'](.*?)[\"'][^>]*>",
        lambda m: f"![{m.group(1).strip()}]({m.group(2).strip()})",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(
        r"<img[^>]*src=[\"'](.*?)[\"'][^>]*>",
        lambda m: f"![]({m.group(1).strip()})",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Basic formatting.
    text = re.sub(r"<(strong|b)[^>]*>(.*?)</\1>", r"**\2**", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<(em|i)[^>]*>(.*?)</\1>", r"*\2*", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<code[^>]*>(.*?)</code>", lambda m: f"`{clean_inline_tags(m.group(1)).strip()}`", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(
        r"<pre[^>]*>(.*?)</pre>",
        lambda m: f"\n```\n{clean_inline_tags(m.group(1)).strip()}\n```\n\n",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Lists.
    text = re.sub(r"</?(ul|ol)[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(
        r"<li[^>]*>(.*?)</li>",
        lambda m: f"- {clean_inline_tags(m.group(1)).strip()}\n",
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Block-level tags -> spacing.
    text = re.sub(r"</?(p|div|section|article|blockquote)[^>]*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<hr\s*/?>", "\n---\n", text, flags=re.IGNORECASE)

    # Remove any remaining HTML tags.
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)

    # Normalize whitespace/newlines.
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def clean_inline_tags(value: str) -> str:
    cleaned = re.sub(r"<[^>]+>", "", value or "")
    return unescape(re.sub(r"\s+", " ", cleaned)).strip()


def looks_like_html(value: str) -> bool:
    return bool(re.search(r"<[a-z][\s\S]*?>", value or "", re.IGNORECASE))


class Command(BaseCommand):
    help = "Convert existing vlog HTML content into markdown text."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show which posts would be converted without saving.",
        )
        parser.add_argument(
            "--slug",
            type=str,
            help="Convert only one post by slug.",
        )
        parser.add_argument(
            "--only-empty",
            action="store_true",
            help="Convert only posts with blank excerpt (extra safety filter).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        slug = options.get("slug")
        only_empty = options["only_empty"]

        queryset = VlogPost.objects.all().order_by("id")
        if slug:
            queryset = queryset.filter(slug=slug)
        if only_empty:
            queryset = queryset.filter(excerpt__exact="")

        total = queryset.count()
        converted = 0
        skipped = 0

        if total == 0:
            self.stdout.write(self.style.WARNING("No matching vlog posts found."))
            return

        self.stdout.write(f"Scanning {total} vlog post(s)...")

        for post in queryset.iterator():
            original = post.content or ""
            if not looks_like_html(original):
                skipped += 1
                continue

            markdown = html_to_markdown(original)
            if not markdown or markdown == original.strip():
                skipped += 1
                continue

            converted += 1
            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(f"[DRY-RUN] Would convert: {post.slug} ({post.title})")
                )
            else:
                post.content = markdown
                post.save(update_fields=["content", "updated_at"])
                self.stdout.write(
                    self.style.SUCCESS(f"Converted: {post.slug} ({post.title})")
                )

        summary = f"Done. Converted={converted}, Skipped={skipped}, Total={total}"
        if dry_run:
            self.stdout.write(self.style.WARNING(f"{summary} [dry-run]"))
        else:
            self.stdout.write(self.style.SUCCESS(summary))
