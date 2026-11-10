"""Browser push (scope #5b).

Subscriptions are stored per user. Sending needs ``pywebpush`` and three env
vars from ``web-push generate-vapid-keys``:

- ``WEB_PUSH_VAPID_PUBLIC_KEY``
- ``WEB_PUSH_VAPID_PRIVATE_KEY``
- ``WEB_PUSH_VAPID_SUBJECT`` (a mailto: address)

When any of those is missing, subscribe still works but nothing is delivered.
"""

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)


def vapid_public_key() -> str:
    return os.environ.get("WEB_PUSH_VAPID_PUBLIC_KEY", "").strip()


def vapid_configured() -> bool:
    return bool(
        vapid_public_key()
        and os.environ.get("WEB_PUSH_VAPID_PRIVATE_KEY", "").strip()
        and os.environ.get("WEB_PUSH_VAPID_SUBJECT", "").strip()
    )


def send_push_to_user(user, payload: dict) -> int:
    """Deliver ``payload`` to every subscription this user has. Returns how many succeeded."""
    if not vapid_configured() or user is None:
        return 0
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.warning("pywebpush is not installed; push notifications were not sent")
        return 0

    from mls.models import WebPushSubscription

    private_key = os.environ["WEB_PUSH_VAPID_PRIVATE_KEY"].strip()
    subject = os.environ["WEB_PUSH_VAPID_SUBJECT"].strip()
    body = json.dumps(payload)
    sent = 0
    for sub in WebPushSubscription.objects.filter(user=user):
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=body,
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                sub.delete()
            else:
                logger.warning("web push failed for user_id=%s status=%s", user.pk, status)
        except Exception:
            logger.exception("web push failed for user_id=%s", getattr(user, "pk", None))
    return sent
