import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

GHL_API_BASE = 'https://services.leadconnectorhq.com'
GHL_API_VERSION = '2021-07-28'


def _headers():
    return {
        'Authorization': f'Bearer {settings.GHL_API_KEY}',
        'Version': GHL_API_VERSION,
        'Content-Type': 'application/json',
    }


# Cached after the first successful lookup so later leads don't repeat it.
_lead_details_field_id = ""
_lead_details_field_checked = False


def _ghl_ready():
    return bool(getattr(settings, "GHL_API_KEY", None) and getattr(settings, "GHL_LOCATION_ID", None))


def _contact_id_from_payload(data):
    if not isinstance(data, dict):
        return None
    contact = data.get("contact")
    if isinstance(contact, dict) and contact.get("id"):
        return contact["id"]
    contacts = data.get("contacts")
    if isinstance(contacts, list):
        for item in contacts:
            if isinstance(item, dict) and item.get("id"):
                return item["id"]
    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    return meta.get("contactId") or data.get("contactId") or data.get("id")


def _find_contact_by_email(email):
    """Return an existing contact id when create is rejected as a duplicate."""
    if not email or not _ghl_ready():
        return None
    try:
        response = requests.get(
            f"{GHL_API_BASE}/contacts/search/duplicate",
            params={"locationId": settings.GHL_LOCATION_ID, "email": email},
            headers=_headers(),
            timeout=12,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("GHL duplicate lookup failed: %s", exc)
        return None
    if response.status_code != 200:
        return None
    try:
        return _contact_id_from_payload(response.json())
    except ValueError:
        return None


def create_ghl_contact(
    first_name,
    last_name,
    email,
    phone=None,
    source=None,
    tags=None,
    note_title=None,
    note_body=None,
):
    """
    Creates a new contact in GoHighLevel.
    Returns the contact ID on success, None on failure.

    When the location already has this email, the existing contact id is
    returned so the caller can still attach what the person asked for.
    note_title / note_body, when set, are written onto that contact.
    """
    if not _ghl_ready():
        logger.warning("GHL create contact skipped: missing API key or location id")
        return None

    payload = {
        "firstName": first_name or "",
        "lastName": last_name or "",
        "email": email,
        "locationId": settings.GHL_LOCATION_ID,
    }
    if phone:
        payload["phone"] = phone
    if source:
        payload["source"] = source
    if tags:
        payload["tags"] = tags

    contact_id = None
    try:
        response = requests.post(
            f"{GHL_API_BASE}/contacts/",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
        try:
            data = response.json()
        except ValueError:
            data = {}
        if response.status_code in (200, 201):
            contact_id = _contact_id_from_payload(data)
            logger.info("GHL contact created: %s", contact_id)
        else:
            contact_id = _contact_id_from_payload(data) or _find_contact_by_email(email)
            if contact_id:
                logger.info("GHL contact already existed: %s", contact_id)
            else:
                logger.error("GHL create contact failed: %s - %s", response.status_code, response.text)
    except requests.exceptions.RequestException as exc:
        logger.error("GHL create contact request error: %s", exc)
        return None

    if contact_id and (note_title or note_body):
        describe_ghl_lead(
            contact_id,
            title=note_title or source or "HomeAtlas",
            body=note_body or note_title or "",
            source=source,
            tags=tags,
        )
    return contact_id


def _post_note(contact_id, payload):
    try:
        response = requests.post(
            f"{GHL_API_BASE}/contacts/{contact_id}/notes",
            json=payload,
            headers=_headers(),
            timeout=12,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("GHL add note request error: %s", exc)
        return False
    if response.status_code in (200, 201):
        logger.info("GHL note added for contact: %s", contact_id)
        return True
    logger.error("GHL add note failed: %s - %s", response.status_code, response.text)
    return False


def add_ghl_contact_note(contact_id, note_text, title=None):
    """
    Appends a note to a GHL contact.
    Returns True on success, False on failure.

    A title is sent when the location accepts it, then the same note is
    retried as body-only. Some locations also require a user id; a failed
    attempt is retried without one.
    """
    text = (note_text or "").strip()
    if not contact_id or not text or not getattr(settings, "GHL_API_KEY", None):
        return False

    rich = {"body": text}
    if title:
        rich["title"] = str(title).strip()[:80]
        rich["pinned"] = True
    user_id = getattr(settings, "GHL_USER_ID", "") or ""
    attempts = []
    if user_id:
        attempts.append({**rich, "userId": user_id})
    attempts.append(dict(rich))
    attempts.append({"body": text})
    sent = []
    for payload in attempts:
        key = tuple(sorted(payload.items()))
        if key in sent:
            continue
        sent.append(key)
        if _post_note(contact_id, payload):
            return True
    return False


def add_ghl_internal_comment(contact_id, message):
    """Puts the lead reason in the contact's conversation, where agents read messages."""
    text = (message or "").strip()
    if not contact_id or not text or not getattr(settings, "GHL_API_KEY", None):
        return False
    payload = {
        "type": "InternalComment",
        "contactId": contact_id,
        "message": text[:4000],
        "status": "delivered",
    }
    user_id = getattr(settings, "GHL_USER_ID", "") or ""
    if user_id:
        payload["userId"] = user_id
    try:
        response = requests.post(
            f"{GHL_API_BASE}/conversations/messages",
            json=payload,
            headers=_headers(),
            timeout=12,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("GHL internal comment request error: %s", exc)
        return False
    if response.status_code in (200, 201):
        logger.info("GHL internal comment added for contact: %s", contact_id)
        return True
    logger.error("GHL internal comment failed: %s - %s", response.status_code, response.text)
    return False


def add_ghl_tags(contact_id, tags):
    cleaned = [tag for tag in (tags or []) if tag]
    if not contact_id or not cleaned or not getattr(settings, "GHL_API_KEY", None):
        return False
    try:
        response = requests.post(
            f"{GHL_API_BASE}/contacts/{contact_id}/tags",
            json={"tags": cleaned},
            headers=_headers(),
            timeout=12,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("GHL add tags request error: %s", exc)
        return False
    if response.status_code in (200, 201):
        return True
    logger.error("GHL add tags failed: %s - %s", response.status_code, response.text)
    return False


def _lead_details_field_id():
    """Id of the contact field named 'Lead details', created once per process if missing."""
    global _lead_details_field_id, _lead_details_field_checked
    if _lead_details_field_checked:
        return _lead_details_field_id
    _lead_details_field_checked = True
    if not _ghl_ready():
        return ""
    location = settings.GHL_LOCATION_ID
    url = f"{GHL_API_BASE}/locations/{location}/customFields"
    try:
        listed = requests.get(url, headers=_headers(), timeout=12)
        fields = []
        if listed.status_code == 200:
            body = listed.json()
            fields = body.get("customFields") or body.get("customField") or []
        for field in fields:
            if isinstance(field, dict) and str(field.get("name") or "").strip().lower() == "lead details":
                _lead_details_field_id = field.get("id") or ""
                return _lead_details_field_id
        created = requests.post(
            url,
            json={"name": "Lead details", "dataType": "LARGE_TEXT", "model": "contact"},
            headers=_headers(),
            timeout=12,
        )
        if created.status_code not in (200, 201):
            logger.error("GHL lead-details field was not created: %s - %s", created.status_code, created.text)
            return ""
        body = created.json()
        field = body.get("customField") if isinstance(body.get("customField"), dict) else body
        _lead_details_field_id = (field or {}).get("id") or ""
        return _lead_details_field_id
    except (requests.exceptions.RequestException, ValueError) as exc:
        logger.error("GHL lead-details field lookup failed: %s", exc)
        return ""


def describe_ghl_lead(contact_id, *, title, body, source=None, tags=None):
    """
    Make a lead's purpose visible on the contact, not only inside a note.

    Writes the reason into the contact source (the column on the contacts
    list), a pinned note, an internal conversation comment, and a Lead details
    field on the contact card. Returns True when at least one of those landed.
    Never raises.
    """
    if not contact_id or not getattr(settings, "GHL_API_KEY", None):
        return False
    heading = (title or "HomeAtlas lead").strip()[:80]
    text = (body or "").strip() or heading
    visible = (source or heading).strip()[:180]
    ok = False
    try:
        if add_ghl_contact_note(contact_id, text, title=heading):
            ok = True
        if add_ghl_internal_comment(contact_id, f"{heading}\n\n{text}" if text != heading else heading):
            ok = True
        if add_ghl_tags(contact_id, tags):
            ok = True
        extra = {"source": visible}
        field_id = _lead_details_field_id()
        if field_id:
            extra["customFields"] = [{"id": field_id, "fieldValue": f"{heading}\n\n{text}"[:5000]}]
        if update_ghl_contact(contact_id, **extra):
            ok = True
    except Exception:
        logger.exception("describe_ghl_lead failed for contact %s", contact_id)
    return ok


def update_ghl_contact(contact_id, **fields):
    """
    Updates an existing contact in GoHighLevel.
    Accepts keyword args matching GHL contact fields (firstName, lastName, phone, email, etc.)
    Also accepts source and customFields, which carry the lead description.
    """
    if not contact_id:
        return False

    payload = {}
    field_map = {
        "first_name": "firstName",
        "last_name": "lastName",
        "phone": "phone",
        "email": "email",
    }
    for python_key, ghl_key in field_map.items():
        if python_key in fields and fields[python_key] is not None:
            payload[ghl_key] = fields[python_key]
    if fields.get("source"):
        payload["source"] = fields["source"]
    custom_fields = fields.get("customFields")
    if custom_fields:
        payload["customFields"] = custom_fields

    if not payload:
        return True

    def _put(body):
        try:
            response = requests.put(
                f"{GHL_API_BASE}/contacts/{contact_id}",
                json=body,
                headers=_headers(),
                timeout=12,
            )
        except requests.exceptions.RequestException as exc:
            logger.error("GHL update contact request error: %s", exc)
            return False
        if response.status_code == 200:
            logger.info("GHL contact updated: %s", contact_id)
            return True
        logger.error("GHL update contact failed: %s - %s", response.status_code, response.text)
        return False

    if _put(payload):
        return True
    if custom_fields:
        payload.pop("customFields", None)
        if payload:
            return _put(payload)
    return False
