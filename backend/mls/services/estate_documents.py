import logging
from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.core import signing
from django.utils import timezone

from ..models import EstateDocument, EstateDocumentIntent


logger = logging.getLogger(__name__)
TOKEN_SALT = "estate-document-access"
PUBLISHED_STATUSES = ("publish", "published")


class EstateDocumentError(Exception):
    def __init__(self, detail, status_code):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass
class PreparedDocumentProxy:
    document: EstateDocument
    upstream: requests.Response


def get_published_document(document_id):
    try:
        return EstateDocument.objects.select_related("project").get(
            pk=document_id,
            project__publication_status__in=PUBLISHED_STATUSES,
        )
    except EstateDocument.DoesNotExist as exc:
        raise EstateDocumentError("Document not found.", 404) from exc


def capture_document_intent(*, document, user, requested_phone=""):
    requested_phone = str(requested_phone or "").strip()
    account_phone = str(user.phone or "").strip()

    if user.phone_verified:
        if not account_phone:
            raise EstateDocumentError("The verified account phone is missing.", 400)
        if requested_phone and requested_phone != account_phone:
            raise EstateDocumentError(
                "The supplied phone must match the verified account phone.",
                400,
            )
        phone = account_phone
    else:
        phone = requested_phone

    if document.requires_phone_verification and not phone:
        raise EstateDocumentError("A phone number is required.", 400)

    return EstateDocumentIntent.objects.create(
        document=document,
        user=user,
        phone=phone,
    )


def authorize_document_access(*, document, user):
    intent = document.intents.filter(user=user).first()
    if not intent:
        raise EstateDocumentError("Document intent must be captured first.", 403)

    if document.requires_phone_verification:
        account_phone = str(user.phone or "").strip()
        if not user.phone_verified or not account_phone:
            raise EstateDocumentError("Phone verification required.", 403)
        if intent.phone != account_phone:
            raise EstateDocumentError("The verified phone does not match the intent.", 403)
        if not intent.verified_at:
            intent.verified_at = timezone.now()
            intent.save(update_fields=["verified_at"])

    return signing.dumps(
        {
            "intent_id": intent.id,
            "document_id": document.id,
            "user_id": user.id,
        },
        salt=TOKEN_SALT,
    )


def _is_allowed_source_url(source_url):
    parsed_url = urlparse(source_url)
    hostname = str(parsed_url.hostname or "").lower().rstrip(".")
    allowed_hosts = {
        str(host or "").lower().rstrip(".")
        for host in settings.ESTATE_DOCUMENT_ALLOWED_HOSTS
    }
    return parsed_url.scheme == "https" and any(
        hostname == allowed or hostname.endswith(f".{allowed}")
        for allowed in allowed_hosts
    )


def prepare_document_proxy(token):
    try:
        payload = signing.loads(
            token,
            salt=TOKEN_SALT,
            max_age=settings.ESTATE_DOCUMENT_ACCESS_MAX_AGE,
        )
        intent_id = int(payload["intent_id"])
        document_id = int(payload["document_id"])
        user_id = int(payload["user_id"])
    except (signing.BadSignature, KeyError, TypeError, ValueError) as exc:
        raise EstateDocumentError("Document not found.", 404) from exc

    try:
        intent = EstateDocumentIntent.objects.select_related(
            "document__project"
        ).get(pk=intent_id)
    except EstateDocumentIntent.DoesNotExist as exc:
        raise EstateDocumentError("Document not found.", 404) from exc

    document = intent.document
    if intent.document_id != document_id or intent.user_id != user_id:
        raise EstateDocumentError("Document not found.", 404)
    if document.project.publication_status not in PUBLISHED_STATUSES:
        raise EstateDocumentError("Document not found.", 404)
    if document.requires_phone_verification and not intent.verified_at:
        raise EstateDocumentError("Document not found.", 404)
    if not _is_allowed_source_url(document.source_url):
        raise EstateDocumentError("Document not found.", 404)

    try:
        upstream = requests.get(
            document.source_url,
            stream=True,
            timeout=(5, 20),
            allow_redirects=False,
        )
    except (requests.ConnectionError, requests.Timeout) as exc:
        logger.exception("Estate document service unavailable for %s", document.id)
        raise EstateDocumentError("External document service unavailable.", 503) from exc
    except requests.RequestException as exc:
        logger.exception("Unable to fetch estate document %s", document.id)
        raise EstateDocumentError("Upstream document fetch failed.", 502) from exc

    if upstream.status_code != 200:
        upstream.close()
        raise EstateDocumentError("Upstream document fetch failed.", 502)

    try:
        content_length = int(upstream.headers.get("Content-Length") or 0)
    except (TypeError, ValueError):
        content_length = 0
    if content_length > settings.ESTATE_DOCUMENT_MAX_BYTES:
        upstream.close()
        raise EstateDocumentError("Document exceeds the response size limit.", 413)

    return PreparedDocumentProxy(document=document, upstream=upstream)


def iter_bounded_content(upstream):
    total = 0
    try:
        for chunk in upstream.iter_content(64 * 1024):
            if not chunk:
                continue
            total += len(chunk)
            if total > settings.ESTATE_DOCUMENT_MAX_BYTES:
                break
            yield chunk
    finally:
        upstream.close()
