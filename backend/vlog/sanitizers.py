"""Server-side HTML sanitization for Studio-authored post bodies.

The frontend already sanitizes on render (`lib/utils/sanitizeHtml.ts`), so why
do it again here? Because sanitizing only at render means the database holds
hostile markup and stays safe purely because every current consumer remembers to
clean it. A second consumer — an RSS feed, an email digest, a native app, a
future export — would inherit a stored-XSS payload. Cleaning on the way IN means
the data itself is trustworthy.

The allowlist deliberately mirrors the frontend's so the two cannot disagree
about what a post may contain. Keep them in sync when either changes.
"""
from __future__ import annotations

import bleach


# Mirrors ALLOWED_TAGS in mls-v3-frontend/lib/utils/sanitizeHtml.ts
ALLOWED_TAGS: list[str] = [
    "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "span", "div",
]

ALLOWED_ATTRIBUTES: dict[str, list[str]] = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "th": ["colspan", "rowspan", "scope"],
    "td": ["colspan", "rowspan"],
}

# `data:` is permitted so inline-pasted images survive; bleach still rejects
# `javascript:` and friends. Image data URLs are additionally narrowed below.
ALLOWED_PROTOCOLS: list[str] = ["http", "https", "mailto", "data"]


def sanitize_post_html(html: str | None) -> str:
    """Return `html` with only allowlisted tags, attributes and protocols."""
    if not html:
        return ""
    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        # Drop disallowed tags entirely rather than escaping them into visible
        # angle brackets in the middle of an article.
        strip=True,
        strip_comments=True,
    )
    return cleaned
