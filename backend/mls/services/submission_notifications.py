"""
Email a listing submitter when a reviewer decides on their submission (scope #2d).
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

from mls.models import ListingSubmission

logger = logging.getLogger(__name__)

Status = ListingSubmission.Status

# Subject line and opening sentence per decision. Statuses missing here
# (draft, submitted, withdrawn) are the submitter's own actions: no email.
DECISION_COPY = {
    Status.UNDER_REVIEW: (
        "We're reviewing your listing",
        "Our team has started reviewing your listing. We'll email you again once we've decided.",
    ),
    Status.NEEDS_CHANGES: (
        "Your listing needs a few changes",
        "Our team reviewed your listing and needs a few changes before it can be published.",
    ),
    Status.APPROVED: (
        "Your listing is live",
        "Good news: your listing has been approved and is now published on our site.",
    ),
    Status.REJECTED: (
        "An update on your listing",
        "Thank you for your submission. After review, we're unable to publish this listing.",
    ),
}


def _public_url(submission: ListingSubmission) -> str:
    base = str(getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if not base:
        return ""
    if submission.status == Status.APPROVED:
        if submission.purpose == ListingSubmission.Purpose.ASSIGNMENT:
            return f"{base}/assignments/{submission.pk}"
        return ""
    # Anything the owner has to act on is edited from their account.
    return f"{base}/watched?tab=listings"


def build_decision_email(submission: ListingSubmission) -> tuple[str, str] | None:
    """(subject, body) for the submission's current status, or None when no email applies."""
    copy = DECISION_COPY.get(submission.status)
    if not copy:
        return None
    subject, opening = copy
    title = submission.project_name or submission.address_line_1
    lines = [
        f"Hi {submission.contact_name or 'there'},",
        "",
        opening,
        "",
        f"Listing: {title}, {submission.city}",
    ]
    note = (submission.review_note or "").strip()
    if note:
        lines += ["", "Note from our team:", note]
    url = _public_url(submission)
    if url:
        lines += ["", f"View it here: {url}"]
    lines += ["", "If you have questions, just reply to this email."]
    return f"{subject}: {title}", "\n".join(lines)


def send_submission_decision_email(submission: ListingSubmission) -> bool:
    """Best-effort email to the submitter. Never raises; returns whether it sent."""
    message = build_decision_email(submission)
    recipient = (submission.contact_email or "").strip()
    if not message or not recipient:
        return False
    subject, body = message
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("send_submission_decision_email failed for submission %s", submission.pk)
        return False
