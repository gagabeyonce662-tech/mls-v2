"""
Email realtor when a property inquiry is submitted.
"""
import logging
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from mls.models import PropertyInquiry
from mls.services.inquiry_ghl import inquiry_detail_lines

logger = logging.getLogger(__name__)


def _admin_change_url(inquiry_id: int) -> str:
    base = getattr(settings, "PUBLIC_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
    return urljoin(base +  f"admin/mls/propertyinquiry/{inquiry_id}/change/")


def send_inquiry_email_to_realtor(inquiry: PropertyInquiry) -> None:
    """
    Best-effort email to REALTOR_INBOX_EMAIL. Never raises.
    """
    try:
        to = getattr(settings, "REALTOR_INBOX_EMAIL", "") or ""
        if not to.strip():
            logger.info("Realtor email skipped: REALTOR_INBOX_EMAIL not set")
            return

        name = f"{inquiry.first_name} {inquiry.last_name}".strip()
        subject = f"New property inquiry from {name or inquiry.email}"

        body_lines = [
            "A visitor submitted a Find My Home / property inquiry.",
            "",
            f"Name: {name}",
            f"Email: {inquiry.email}",
            f"Phone: {inquiry.phone or '—'}",
            f"Intent: {inquiry.get_intent_display()}",
            "",
            "Message:",
            inquiry.message,
            "",
            *inquiry_detail_lines(inquiry),
            "",
            f"Django admin: {_admin_change_url(inquiry.pk)}",
        ]
        body = "\n".join(body_lines)

        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to.strip()],
            fail_silently=False,
        )
        inquiry.email_sent_at = timezone.now()
        inquiry.save(update_fields=["email_sent_at", "updated_at"])
    except Exception as e:
        logger.exception("send_inquiry_email_to_realtor failed")
        err = f"Email error: {e}"
        inquiry.last_error = f"{(inquiry.last_error or '').strip()}\n{err}".strip()
        try:
            inquiry.save(update_fields=["last_error", "updated_at"])
        except Exception:
            pass
