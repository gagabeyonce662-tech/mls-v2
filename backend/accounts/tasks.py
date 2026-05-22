"""
Email sending for account verification.

Called directly (synchronously) from views — no Celery/Redis needed,
same pattern as the Twilio OTP flow.
"""

from __future__ import annotations

import logging
from datetime import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)
User = get_user_model()


def _send_now(user_id: int, token: str) -> dict:
    """
    Render the HTML template and fire the SendGrid API call.
    Returns {"sent": True} on success, {"sent": False, "reason": ...} on failure.
    """
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_verification_email: user %s not found", user_id)
        return {"sent": False, "reason": "user_not_found"}

    frontend_url = (
        getattr(settings, "FRONTEND_URL", "https://app.ravan.ai") or "https://app.ravan.ai"
    ).rstrip("/")
    verification_url = f"{frontend_url}/verify-email?token={token}"

    context = {
        "first_name": user.first_name or "",
        "verification_url": verification_url,
        "year": datetime.now().year,
    }

    html_body = render_to_string("emails/verify_email.html", context)
    text_body = (
        f"Hi {user.first_name or 'there'},\n\n"
        f"Please verify your email address by visiting the link below.\n"
        f"The link expires in 24 hours.\n\n"
        f"{verification_url}\n\n"
        f"If you did not create an account, you can safely ignore this email."
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@vsell4u.ca")
    subject = "Verify your VSell4U email address"

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        logger.info("Verification email sent to %s (user_id=%s)", user.email, user_id)
        return {"sent": True}
    except Exception as exc:
        logger.error(
            "send_verification_email failed for user %s (%s): %s",
            user_id, user.email, exc,
        )
        return {"sent": False, "reason": str(exc)}
