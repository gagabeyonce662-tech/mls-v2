"""
Sync property inquiries to GoHighLevel (contact + note).
"""
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.services import add_ghl_contact_note, create_ghl_contact
from mls.models import PropertyInquiry

logger = logging.getLogger(__name__)


def _format_inquiry_note(inquiry: PropertyInquiry) -> str:
    lines = [
        "Property inquiry (Find My Home)",
        "",
        f"Intent: {inquiry.get_intent_display()}",
        f"Message:\n{inquiry.message}",
        "",
        f"Preferred locations: {inquiry.preferred_locations or '—'}",
        f"Property types: {inquiry.property_types or '—'}",
        f"Budget: {inquiry.budget_min or '—'} – {inquiry.budget_max or '—'}",
        f"Min beds / baths: {inquiry.bedrooms_min or '—'} / {inquiry.bathrooms_min or '—'}",
        f"Timeline: {inquiry.timeline or '—'}",
        f"Page URL: {inquiry.page_url or '—'}",
        f"Inquiry ID (DB): {inquiry.pk}",
    ]
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

        if not contact_id:
            contact_id = create_ghl_contact(
                inquiry.first_name,
                inquiry.last_name or "",
                inquiry.email,
                inquiry.phone or None,
                source="property-inquiry",
                tags=["property-inquiry"],
            )

        if not contact_id:
            inquiry.last_error = (inquiry.last_error or "").strip()
            err = "GHL: could not resolve or create contact."
            inquiry.last_error = f"{inquiry.last_error}\n{err}".strip() if inquiry.last_error else err
            inquiry.save(update_fields=["last_error", "updated_at"])
            return

        inquiry.ghl_contact_id = contact_id
        inquiry.save(update_fields=["ghl_contact_id", "updated_at"])

        note_ok = add_ghl_contact_note(contact_id, _format_inquiry_note(inquiry))
        if note_ok:
            inquiry.ghl_synced_at = timezone.now()
            inquiry.save(update_fields=["ghl_synced_at", "updated_at"])
        else:
            err = "GHL: contact saved but note failed."
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
