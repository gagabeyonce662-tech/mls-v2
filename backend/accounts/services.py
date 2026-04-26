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


def create_ghl_contact(
    first_name,
    last_name,
    email,
    phone=None,
    source=None,
    tags=None,
):
    """
    Creates a new contact in GoHighLevel.
    Returns the contact ID on success, None on failure.
    """
    if not getattr(settings, "GHL_API_KEY", None) or not getattr(
        settings, "GHL_LOCATION_ID", None
    ):
        logger.warning("GHL create contact skipped: missing API key or location id")
        return None

    payload = {
        'firstName': first_name or '',
        'lastName': last_name or '',
        'email': email,
        'locationId': settings.GHL_LOCATION_ID,
    }
    if phone:
        payload['phone'] = phone
    if source:
        payload['source'] = source
    if tags:
        payload['tags'] = tags

    try:
        response = requests.post(
            f'{GHL_API_BASE}/contacts/',
            json=payload,
            headers=_headers(),
        )
        if response.status_code in (200, 201):
            data = response.json()
            contact_id = data.get('contact', {}).get('id')
            logger.info(f'GHL contact created: {contact_id}')
            return contact_id
        else:
            logger.error(f'GHL create contact failed: {response.status_code} - {response.text}')
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f'GHL create contact request error: {e}')
        return None


def add_ghl_contact_note(contact_id, note_text):
    """
    Appends a note to a GHL contact.
    Returns True on success, False on failure.
    """
    if not contact_id or not getattr(settings, "GHL_API_KEY", None):
        return False

    body = {'body': note_text or ''}
    user_id = getattr(settings, 'GHL_USER_ID', '') or ''
    if user_id:
        body['userId'] = user_id

    try:
        response = requests.post(
            f'{GHL_API_BASE}/contacts/{contact_id}/notes',
            json=body,
            headers=_headers(),
        )
        if response.status_code in (200, 201):
            logger.info(f'GHL note added for contact: {contact_id}')
            return True
        logger.error(
            f'GHL add note failed: {response.status_code} - {response.text}'
        )
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f'GHL add note request error: {e}')
        return False


def update_ghl_contact(contact_id, **fields):
    """
    Updates an existing contact in GoHighLevel.
    Accepts keyword args matching GHL contact fields (firstName, lastName, phone, email, etc.)
    """
    if not contact_id:
        return False

    payload = {}
    field_map = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'phone': 'phone',
        'email': 'email',
    }
    for python_key, ghl_key in field_map.items():
        if python_key in fields and fields[python_key] is not None:
            payload[ghl_key] = fields[python_key]

    if not payload:
        return True

    try:
        response = requests.put(
            f'{GHL_API_BASE}/contacts/{contact_id}',
            json=payload,
            headers=_headers(),
        )
        if response.status_code == 200:
            logger.info(f'GHL contact updated: {contact_id}')
            return True
        else:
            logger.error(f'GHL update contact failed: {response.status_code} - {response.text}')
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f'GHL update contact request error: {e}')
        return False
