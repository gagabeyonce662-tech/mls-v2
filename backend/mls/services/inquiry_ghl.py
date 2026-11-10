"""
Sync property inquiries to GoHighLevel (contact + note).
"""
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.services import create_ghl_contact, describe_ghl_lead
from mls.models import PropertyInquiry

logger = logging.getLogger(__name__)


def _inquiry_tags(inquiry: PropertyInquiry) -> list[str]:
    """Tags so market-trends and assignment leads are distinguishable in the CRM."""
    url = (inquiry.page_url or "").lower()
    key = (inquiry.listing_key or "").upper()
    tags = ["property-inquiry"]
    if inquiry.intent == "showing":
        tags.append("schedule-viewing")
    if "market-trends" in url or inquiry.intent == "explore":
        tags.append("market-trends")
    if "/assignments" in url or key.startswith("ASSIGNMENT-"):
        tags.append("assignment-inquiry")
    if inquiry.is_vip_list:
        tags.append("precon-vip")
    if "/preconstruction" in url or key.startswith("PRECON-") or inquiry.is_vip_list:
        tags.append("precon-inquiry")
    return tags


def _lead_heading(inquiry: PropertyInquiry) -> str:
    if inquiry.is_vip_list:
        return "VIP preconstruction access"
    if inquiry.intent == "showing":
        return "Schedule viewing"
    return inquiry.get_intent_display() or "Property inquiry"


def _lead_source(inquiry: PropertyInquiry) -> str:
    """One line an agent can read on the contact without opening a note."""
    heading = _lead_heading(inquiry)
    message = " ".join((inquiry.message or "").split())
    if message:
        return f"{heading}: {message}"[:180]
    return heading


def _text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _detail_line(label: str, value) -> str | None:
    text = _text(value)
    if not text:
        return None
    return f"{label}: {text}"


def inquiry_detail_lines(inquiry: PropertyInquiry) -> list[str]:
    """
    Search criteria and page context for the CRM note and the realtor email.

    Schedule viewing only collects a message, so property type, budget, beds,
    baths and timeline are usually blank. Those lines are left out instead of
    printed as dashes. A line is included only when the visitor actually
    supplied it.
    """
    lines: list[str] = []

    def add(line: str | None) -> None:
        if line:
            lines.append(line)

    add(_detail_line("Preferred locations", inquiry.preferred_locations))
    add(_detail_line("Property types", inquiry.property_types))

    budget_min = inquiry.budget_min
    budget_max = inquiry.budget_max
    if budget_min is not None and budget_max is not None:
        add(f"Budget: {budget_min} – {budget_max}")
    elif budget_min is not None:
        add(f"Budget min: {budget_min}")
    elif budget_max is not None:
        add(f"Budget max: {budget_max}")

    beds = inquiry.bedrooms_min
    baths = inquiry.bathrooms_min
    if beds is not None and baths is not None:
        add(f"Min beds / baths: {beds} / {baths}")
    elif beds is not None:
        add(f"Min beds: {beds}")
    elif baths is not None:
        add(f"Min baths: {baths}")

    add(_detail_line("Timeline", inquiry.timeline))
    add(_detail_line("Page URL", inquiry.page_url))
    if inquiry.pk:
        add(f"Inquiry ID (DB): {inquiry.pk}")
    return lines


def _format_inquiry_note(inquiry: PropertyInquiry) -> str:
    lines = [
        _lead_heading(inquiry),
        "",
        f"Intent: {inquiry.get_intent_display()}",
        f"Message:\n{inquiry.message}",
    ]
    details = inquiry_detail_lines(inquiry)
    if details:
        lines.extend(["", *details])
    return "\n".join(lines)


def sync_inquiry_to_ghl(inquiry: PropertyInquiry) -> None:
    """
    Best-effort: resolve or create GHL contact, add note, update inquiry fields.
    Never raises.
    """
    try:
        contact_id = None

        if inquiry.user_id and getattr(inquiry.user, "ghl_contact_id", None):
            contact_id = inquiry.user.ghl_contact_id

        if not contact_id:
            User = get_user_model()
            email_match = (
                User.objects.filter(email__iexact=inquiry.email.strip())
                .exclude(ghl_contact_id__isnull=True)
                .exclude(ghl_contact_id="")
                .first()
            )
            if email_match and getattr(email_match, "ghl_contact_id", None):
                contact_id = email_match.ghl_contact_id

        heading = _lead_heading(inquiry)
        source = _lead_source(inquiry)
        tags = _inquiry_tags(inquiry)
        if not contact_id:
            contact_id = create_ghl_contact(
                inquiry.first_name,
                inquiry.last_name or "",
                inquiry.email,
                inquiry.phone or None,
                source=source,
                tags=tags,
            )

        if not contact_id:
            inquiry.last_error = (inquiry.last_error or "").strip()
            err = "GHL: could not resolve or create contact."
            inquiry.last_error = f"{inquiry.last_error}\n{err}".strip() if inquiry.last_error else err
            inquiry.save(update_fields=["last_error", "updated_at"])
            return

        inquiry.ghl_contact_id = contact_id
        inquiry.save(update_fields=["ghl_contact_id", "updated_at"])

        note_ok = describe_ghl_lead(
            contact_id,
            title=heading,
            body=_format_inquiry_note(inquiry),
            source=source,
            tags=tags,
        )
        if note_ok:
            inquiry.ghl_synced_at = timezone.now()
            inquiry.save(update_fields=["ghl_synced_at", "updated_at"])
        else:
            err = "GHL: contact saved but the lead description could not be attached."
            inquiry.last_error = f"{(inquiry.last_error or '').strip()}\n{err}".strip()
            inquiry.save(update_fields=["last_error", "updated_at"])
    except Exception as e:
        logger.exception("sync_inquiry_to_ghl failed")
        err = f"GHL sync error: {e}"
        inquiry.last_error = f"{(inquiry.last_error or '').strip()}\n{err}".strip()
        try:
            inquiry.save(update_fields=["last_error", "updated_at"])
        except Exception:
            pass
