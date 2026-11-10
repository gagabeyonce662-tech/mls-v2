"""Best-effort GoHighLevel sync for leads that are not property inquiries.

Property inquiries already sync through ``inquiry_ghl``. This covers the
remaining forms: newsletter, neighbour alerts, home-valuation requests from a
signed-in visitor, and assignment submissions. Missing CRM keys are a no-op.
"""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model

from accounts.services import create_ghl_contact, describe_ghl_lead

logger = logging.getLogger(__name__)

_TITLES = {
    "newsletter": "Newsletter sign-up",
    "neighbour-alert": "Neighbour alert",
    "assignment-submission": "Assignment submission",
    "home-valuation": "Home valuation",
}


def _visible_source(title: str, body: str) -> str:
    first = ""
    for line in (body or "").splitlines():
        line = " ".join(line.split())
        if line and line.lower() != title.lower():
            first = line
            break
    if first:
        return f"{title}: {first}"[:180]
    return title[:180]


def push_lead_to_ghl(
    *,
    email: str,
    first_name: str = "",
    last_name: str = "",
    phone: str | None = None,
    source: str,
    tags: list[str] | None = None,
    note: str,
    user=None,
) -> None:
    """Resolve or create a contact and record what the lead is for. Never raises."""
    email = (email or "").strip()
    if not email:
        return
    heading = _TITLES.get(source, (source or "HomeAtlas lead").replace("-", " ").strip().title())
    visible = _visible_source(heading, note)
    lead_tags = tags or [source]
    try:
        contact_id = None
        if user is not None and getattr(user, "ghl_contact_id", None):
            contact_id = user.ghl_contact_id

        if not contact_id:
            User = get_user_model()
            match = (
                User.objects.filter(email__iexact=email)
                .exclude(ghl_contact_id__isnull=True)
                .exclude(ghl_contact_id="")
                .first()
            )
            if match and match.ghl_contact_id:
                contact_id = match.ghl_contact_id

        if not contact_id:
            contact_id = create_ghl_contact(
                first_name or "",
                last_name or "",
                email,
                phone or None,
                source=visible,
                tags=lead_tags,
            )
            if contact_id and user is not None and not getattr(user, "ghl_contact_id", None):
                user.ghl_contact_id = contact_id
                user.save(update_fields=["ghl_contact_id"])

        if contact_id and note:
            describe_ghl_lead(contact_id, title=heading, body=note, source=visible, tags=lead_tags)
    except Exception:
        logger.exception("push_lead_to_ghl failed for source=%s", source)
