"""SendGrid HTTP API email backend for Django (non-SMTP)."""

from __future__ import annotations

import logging
from typing import Iterable

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class SendGridAPIEmailBackend(BaseEmailBackend):
    """
    Send email through SendGrid v3 Mail Send API.

    Required setting:
      - SENDGRID_API_KEY
    Optional settings:
      - SENDGRID_BASE_URL (default: https://api.sendgrid.com/v3)
      - SENDGRID_TIMEOUT_SECONDS (default: 15)
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = (getattr(settings, "SENDGRID_API_KEY", "") or "").strip()
        self.base_url = (getattr(settings, "SENDGRID_BASE_URL", "https://api.sendgrid.com/v3") or "").rstrip("/")
        self.timeout = int(getattr(settings, "SENDGRID_TIMEOUT_SECONDS", 15) or 15)

    def open(self) -> bool:
        return True

    def close(self) -> None:
        return None

    def send_messages(self, email_messages: Iterable) -> int:
        if not email_messages:
            return 0
        if not self.api_key:
            msg = "SENDGRID_API_KEY is not configured"
            if self.fail_silently:
                logger.warning(msg)
                return 0
            raise ValueError(msg)

        sent_count = 0
        for message in email_messages:
            if not getattr(message, "recipients", None):
                continue
            recipients = message.recipients()
            if not recipients:
                continue

            payload = self._build_payload(message)
            try:
                response = requests.post(
                    f"{self.base_url}/mail/send",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=self.timeout,
                )
                if response.status_code == 202:
                    sent_count += 1
                else:
                    error_msg = (
                        f"SendGrid send failed: status={response.status_code} body={response.text[:1000]}"
                    )
                    if self.fail_silently:
                        logger.warning(error_msg)
                    else:
                        response.raise_for_status()
            except Exception:
                if not self.fail_silently:
                    raise
                logger.exception("SendGrid send exception")
        return sent_count

    def _build_payload(self, message) -> dict:
        from_email = (message.from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "") or "").strip()
        if not from_email:
            raise ValueError("from_email is required for SendGrid")

        to_list = [{"email": addr} for addr in (message.to or []) if addr]
        cc_list = [{"email": addr} for addr in (message.cc or []) if addr]
        bcc_list = [{"email": addr} for addr in (message.bcc or []) if addr]

        personalization = {"to": to_list}
        if cc_list:
            personalization["cc"] = cc_list
        if bcc_list:
            personalization["bcc"] = bcc_list

        contents = [{"type": "text/plain", "value": message.body or ""}]

        for alt_body, mimetype in getattr(message, "alternatives", []) or []:
            if mimetype == "text/html":
                contents.append({"type": "text/html", "value": alt_body or ""})

        payload = {
            "from": {"email": from_email},
            "subject": message.subject or "",
            "personalizations": [personalization],
            "content": contents,
        }

        reply_to = getattr(message, "reply_to", None)
        if reply_to:
            first = next((addr for addr in reply_to if addr), None)
            if first:
                payload["reply_to"] = {"email": first}

        return payload
