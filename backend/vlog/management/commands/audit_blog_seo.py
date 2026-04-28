from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

from django.core.management.base import BaseCommand

from vlog.models import VlogPost


class Command(BaseCommand):
    help = "Audit blog SEO quality and export an actionable CSV report."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="reports/seo/blog_seo_audit.csv",
            help="CSV output path relative to backend/ (default: reports/seo/blog_seo_audit.csv)",
        )

    def handle(self, *args, **options):
        output_path = Path(options["output"])
        if not output_path.is_absolute():
            output_path = Path.cwd() / output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)

        posts = list(VlogPost.objects.all().order_by("id"))
        rows: List[Dict[str, str]] = []
        issue_counter: Counter = Counter()
        title_count: Counter = Counter()

        effective_titles: Dict[int, str] = {}
        for post in posts:
            effective_title = (post.seo_title or "").strip() or (post.title or "").strip()
            effective_titles[post.id] = effective_title.lower()
            if effective_title:
                title_count[effective_title.lower()] += 1

        for post in posts:
            row, issues = self._audit_post(post, effective_titles, title_count)
            rows.append(row)
            issue_counter.update(issues)

        self._write_csv(output_path, rows)

        avg_score = round(
            sum(int(row["score"]) for row in rows) / len(rows), 2
        ) if rows else 0
        self.stdout.write(self.style.SUCCESS(f"SEO audit complete: {len(rows)} posts"))
        self.stdout.write(f"Average score: {avg_score}")
        self.stdout.write(f"CSV: {output_path}")
        self.stdout.write("Issue counts:")
        if issue_counter:
            for code, count in sorted(issue_counter.items()):
                self.stdout.write(f"  - {code}: {count}")
        else:
            self.stdout.write("  - none")

    def _audit_post(
        self, post: VlogPost, effective_titles: Dict[int, str], title_count: Counter
    ) -> Tuple[Dict[str, str], List[str]]:
        issues: List[str] = []

        seo_title = (post.seo_title or "").strip()
        fallback_title = (post.title or "").strip()
        effective_title = seo_title or fallback_title

        seo_description = (post.seo_description or "").strip()
        fallback_description = self._fallback_description(post.excerpt, post.content)
        effective_description = seo_description or fallback_description
        description_len = len(effective_description)

        seo_keywords = (post.seo_keywords or "").strip()
        focus_keyword = (post.focus_keyword or "").strip()
        canonical = (post.seo_canonical_url or "").strip()

        has_social_image = bool(post.twitter_image or post.og_image or post.thumbnail)

        if not seo_title:
            issues.append("missing_seo_title")
        if len(effective_title) < 30:
            issues.append("short_title")
        if len(effective_title) > 65:
            issues.append("long_title")

        if not seo_description:
            issues.append("missing_seo_description")
        if description_len < 70:
            issues.append("short_description")
        if description_len > 170:
            issues.append("long_description")

        if not seo_keywords and not focus_keyword:
            issues.append("missing_keywords_and_focus_keyword")

        if title_count.get(effective_titles.get(post.id, ""), 0) > 1 and effective_title:
            issues.append("duplicate_effective_title")

        if canonical and not canonical.startswith(("http://", "https://")):
            issues.append("invalid_canonical_url")

        if not has_social_image:
            issues.append("missing_social_image")

        score = max(0, 100 - (len(issues) * 8))

        row = {
            "post_id": str(post.id),
            "slug": post.slug or "",
            "status": post.status or "",
            "effective_title": effective_title,
            "effective_description_len": str(description_len),
            "score": str(score),
            "issues": "|".join(issues),
        }
        return row, issues

    def _fallback_description(self, excerpt: str, content: str) -> str:
        source = (excerpt or "").strip() or (content or "").strip()
        flattened = " ".join(source.split())
        return flattened[:155]

    def _write_csv(self, path: Path, rows: List[Dict[str, str]]):
        fieldnames = [
            "post_id",
            "slug",
            "status",
            "effective_title",
            "effective_description_len",
            "score",
            "issues",
        ]
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
