"""Connection values saved in the admin console, with env as the fallback.

The public site only receives the fields marked public. A saved value replaces
the server environment until it is cleared.
"""

from __future__ import annotations

import time

from django.conf import settings
from django.db.utils import OperationalError, ProgrammingError

# key, env name, django setting attribute or "", public, secret, group, label, hint
FIELDS: tuple[dict, ...] = (
    {"key": "apiBaseUrl", "env": "API_BASE_URL", "also": ["NEXT_PUBLIC_API_BASE_URL"], "setting": "", "public": True, "secret": False, "group": "Website", "label": "Backend address", "hint": "Where the website calls the server."},
    {"key": "whatsappNumber", "env": "NEXT_PUBLIC_WHATSAPP_NUMBER", "setting": "", "public": True, "secret": False, "group": "Website", "label": "WhatsApp number", "hint": "Digits with the country code, such as 14168214200. Buttons use this number."},
    {"key": "siteUrl", "env": "NEXT_PUBLIC_SITE_URL", "setting": "", "public": True, "secret": False, "group": "Website", "label": "Website address", "hint": "The public site address, such as https://mls-xi-rouge.vercel.app."},
    {"key": "gaMeasurementId", "env": "NEXT_PUBLIC_GA_MEASUREMENT_ID", "setting": "", "public": True, "secret": False, "group": "Website", "label": "Google Analytics ID", "hint": "Loads only after a visitor accepts cookies."},
    {"key": "metaPixelId", "env": "NEXT_PUBLIC_META_PIXEL_ID", "setting": "", "public": True, "secret": False, "group": "Website", "label": "Meta Pixel ID", "hint": "Loads only after a visitor accepts cookies."},
    {"key": "googleAdsId", "env": "NEXT_PUBLIC_GOOGLE_ADS_ID", "setting": "", "public": True, "secret": False, "group": "Website", "label": "Google Ads ID", "hint": "Loads only after a visitor accepts cookies."},
    {"key": "googleClientId", "env": "GOOGLE_CLIENT_ID", "also": ["NEXT_PUBLIC_GOOGLE_CLIENT_ID"], "setting": "GOOGLE_CLIENT_ID", "public": True, "secret": False, "group": "Sign-in", "label": "Google sign-in ID", "hint": "The same ID goes on the website and the server."},
    {"key": "googleClientSecret", "env": "GOOGLE_CLIENT_SECRET", "setting": "GOOGLE_CLIENT_SECRET", "public": False, "secret": True, "group": "Sign-in", "label": "Google sign-in secret", "hint": "From Google Cloud."},
    {"key": "facebookAppId", "env": "FACEBOOK_APP_ID", "also": ["NEXT_PUBLIC_FACEBOOK_APP_ID"], "setting": "FACEBOOK_APP_ID", "public": True, "secret": False, "group": "Sign-in", "label": "Facebook app ID", "hint": "Shown on the sign-in button. Leave blank to hide Facebook sign-in."},
    {"key": "facebookAppSecret", "env": "FACEBOOK_APP_SECRET", "setting": "FACEBOOK_APP_SECRET", "public": False, "secret": True, "group": "Sign-in", "label": "Facebook app secret", "hint": ""},
    {"key": "facebookGraphVersion", "env": "FACEBOOK_GRAPH_VERSION", "also": ["NEXT_PUBLIC_FACEBOOK_GRAPH_VERSION"], "setting": "FACEBOOK_GRAPH_VERSION", "public": True, "secret": False, "group": "Sign-in", "label": "Facebook version", "hint": "Usually v19.0."},
    {"key": "facebookRedirectUri", "env": "FACEBOOK_REDIRECT_URI", "setting": "FACEBOOK_REDIRECT_URI", "public": False, "secret": False, "group": "Sign-in", "label": "Facebook return address", "hint": "https://mls-xi-rouge.vercel.app/api/auth/facebook/callback"},
    {"key": "facebookAllowedRedirectUris", "env": "FACEBOOK_ALLOWED_REDIRECT_URIS", "setting": "FACEBOOK_ALLOWED_REDIRECT_URIS", "public": False, "secret": False, "group": "Sign-in", "label": "Extra Facebook return addresses", "hint": "Comma-separated, if staging and production both sign in."},
    {"key": "emailBackend", "env": "EMAIL_BACKEND", "setting": "EMAIL_BACKEND", "public": False, "secret": False, "group": "Email", "label": "Email sender", "hint": "backend.sendgrid_email_backend.SendGridAPIEmailBackend sends real mail."},
    {"key": "sendgridApiKey", "env": "SENDGRID_API_KEY", "setting": "SENDGRID_API_KEY", "public": False, "secret": True, "group": "Email", "label": "SendGrid key", "hint": "Sends verification mail, alerts, and lead notices."},
    {"key": "sendgridBaseUrl", "env": "SENDGRID_BASE_URL", "setting": "SENDGRID_BASE_URL", "public": False, "secret": False, "group": "Email", "label": "SendGrid address", "hint": "Usually https://api.sendgrid.com/v3."},
    {"key": "sendgridTimeoutSeconds", "env": "SENDGRID_TIMEOUT_SECONDS", "setting": "SENDGRID_TIMEOUT_SECONDS", "public": False, "secret": False, "group": "Email", "label": "SendGrid timeout", "hint": "Seconds to wait for SendGrid."},
    {"key": "emailHost", "env": "EMAIL_HOST", "setting": "EMAIL_HOST", "public": False, "secret": False, "group": "Email", "label": "SMTP host", "hint": "Only used if email is sent by SMTP instead of SendGrid."},
    {"key": "emailPort", "env": "EMAIL_PORT", "setting": "EMAIL_PORT", "public": False, "secret": False, "group": "Email", "label": "SMTP port", "hint": "Usually 587."},
    {"key": "emailHostUser", "env": "EMAIL_HOST_USER", "setting": "EMAIL_HOST_USER", "public": False, "secret": False, "group": "Email", "label": "SMTP username", "hint": ""},
    {"key": "emailHostPassword", "env": "EMAIL_HOST_PASSWORD", "setting": "EMAIL_HOST_PASSWORD", "public": False, "secret": True, "group": "Email", "label": "SMTP password", "hint": ""},
    {"key": "emailUseTls", "env": "EMAIL_USE_TLS", "setting": "EMAIL_USE_TLS", "public": False, "secret": False, "group": "Email", "label": "SMTP TLS", "hint": "True or False."},
    {"key": "emailVerificationExpiryHours", "env": "EMAIL_VERIFICATION_EXPIRY_HOURS", "setting": "EMAIL_VERIFICATION_EXPIRY_HOURS", "public": False, "secret": False, "group": "Email", "label": "Verification link lifetime", "hint": "Hours before an email verification link expires."},
    {"key": "defaultFromEmail", "env": "DEFAULT_FROM_EMAIL", "setting": "DEFAULT_FROM_EMAIL", "public": False, "secret": False, "group": "Email", "label": "From address", "hint": "The address mail is sent from. The domain must be verified in SendGrid."},
    {"key": "realtorInboxEmail", "env": "REALTOR_INBOX_EMAIL", "setting": "REALTOR_INBOX_EMAIL", "public": False, "secret": False, "group": "Email", "label": "Lead inbox", "hint": "Where inquiry emails are delivered."},
    {"key": "frontendUrl", "env": "FRONTEND_URL", "setting": "FRONTEND_URL", "public": False, "secret": False, "group": "Email", "label": "Links in email", "hint": "The site address used inside verification and alert emails."},
    {"key": "newsletterSiteUrl", "env": "NEWSLETTER_SITE_URL", "setting": "", "public": False, "secret": False, "group": "Email", "label": "Newsletter site address", "hint": "Links inside the newsletter."},
    {"key": "ghlApiKey", "env": "GHL_API_KEY", "setting": "GHL_API_KEY", "public": False, "secret": True, "group": "CRM", "label": "GoHighLevel key", "hint": "Private integration token."},
    {"key": "ghlLocationId", "env": "GHL_LOCATION_ID", "setting": "GHL_LOCATION_ID", "public": False, "secret": False, "group": "CRM", "label": "GoHighLevel location", "hint": "The location this site writes contacts into."},
    {"key": "ghlUserId", "env": "GHL_USER_ID", "setting": "GHL_USER_ID", "public": False, "secret": False, "group": "CRM", "label": "GoHighLevel user", "hint": "The user attached to new notes."},
    {"key": "twilioAccountSid", "env": "TWILIO_ACCOUNT_SID", "setting": "TWILIO_ACCOUNT_SID", "public": False, "secret": False, "group": "Phone verification", "label": "Twilio account SID", "hint": "Starts with AC."},
    {"key": "twilioAuthToken", "env": "TWILIO_AUTH_TOKEN", "setting": "TWILIO_AUTH_TOKEN", "public": False, "secret": True, "group": "Phone verification", "label": "Twilio auth token", "hint": ""},
    {"key": "twilioVerifyServiceSid", "env": "TWILIO_VERIFY_SERVICE_SID", "setting": "TWILIO_VERIFY_SERVICE_SID", "public": False, "secret": False, "group": "Phone verification", "label": "Twilio Verify service", "hint": "Starts with VA."},
    {"key": "twilioPhoneNumber", "env": "TWILIO_PHONE_NUMBER", "setting": "", "public": False, "secret": False, "group": "Phone verification", "label": "Twilio phone number", "hint": "Digits only, with country code."},
    {"key": "openaiApiKey", "env": "GEMINI_API_KEY", "also": ["OPENAI_API_KEY"], "setting": "", "public": False, "secret": True, "group": "AI", "label": "Gemini API key", "hint": "Paste the Gemini key here. Search, listing summaries, and the assistant use it."},
    {"key": "cloudinaryCloudName", "env": "CLOUDINARY_CLOUD_NAME", "setting": "", "public": False, "secret": False, "group": "Photos", "label": "Cloudinary cloud name", "hint": "Where uploaded photos and files are stored."},
    {"key": "cloudinaryApiKey", "env": "CLOUDINARY_API_KEY", "setting": "", "public": False, "secret": False, "group": "Photos", "label": "Cloudinary API key", "hint": ""},
    {"key": "cloudinaryApiSecret", "env": "CLOUDINARY_API_SECRET", "setting": "", "public": False, "secret": True, "group": "Photos", "label": "Cloudinary API secret", "hint": ""},
    {"key": "cloudinaryUrl", "env": "CLOUDINARY_URL", "setting": "", "public": False, "secret": True, "group": "Photos", "label": "Cloudinary URL", "hint": "cloudinary://key:secret@cloud-name"},
    {"key": "estateImageMaxUploadMb", "env": "ESTATE_IMAGE_MAX_UPLOAD_MB", "setting": "ESTATE_IMAGE_MAX_UPLOAD_MB", "public": False, "secret": False, "group": "Photos", "label": "Image upload limit", "hint": "Megabytes."},
    {"key": "preconAssetMaxUploadMb", "env": "PRECON_ASSET_MAX_UPLOAD_MB", "setting": "PRECON_ASSET_MAX_UPLOAD_MB", "public": False, "secret": False, "group": "Photos", "label": "Pre-construction file limit", "hint": "Megabytes."},
    {"key": "estateDocumentAllowedHosts", "env": "ESTATE_DOCUMENT_ALLOWED_HOSTS", "setting": "ESTATE_DOCUMENT_ALLOWED_HOSTS", "public": False, "secret": False, "group": "Photos", "label": "Allowed file hosts", "hint": "Comma-separated host names."},
    {"key": "ddfClientId", "env": "DDF_CLIENT_ID", "setting": "CLIENT_ID", "public": False, "secret": False, "group": "Listings", "label": "Listing feed ID", "hint": "CREA DDF client ID. Used when listings are synced."},
    {"key": "ddfClientSecret", "env": "DDF_CLIENT_SECRET", "setting": "CLIENT_SECRET", "public": False, "secret": True, "group": "Listings", "label": "Listing feed secret", "hint": "CREA DDF client secret."},
    {"key": "ampreBaseUrl", "env": "AMPRE_ODATA_BASE_URL", "setting": "AMPRE_ODATA_BASE_URL", "public": False, "secret": False, "group": "Market trends", "label": "Sold-data address", "hint": "Usually https://query.ampre.ca/odata."},
    {"key": "ampreBearerToken", "env": "AMPRE_ODATA_BEARER_TOKEN", "setting": "AMPRE_ODATA_BEARER_TOKEN", "public": False, "secret": True, "group": "Market trends", "label": "Sold-data token", "hint": "TRREB / AMPRE token. Market trends read sold prices with this."},
    {"key": "webPushPublicKey", "env": "WEB_PUSH_VAPID_PUBLIC_KEY", "setting": "", "public": False, "secret": False, "group": "Browser alerts", "label": "Push public key", "hint": "From a VAPID key pair."},
    {"key": "webPushPrivateKey", "env": "WEB_PUSH_VAPID_PRIVATE_KEY", "setting": "", "public": False, "secret": True, "group": "Browser alerts", "label": "Push private key", "hint": ""},
    {"key": "webPushSubject", "env": "WEB_PUSH_VAPID_SUBJECT", "setting": "", "public": False, "secret": False, "group": "Browser alerts", "label": "Push contact", "hint": "A mailto: address, such as mailto:info@estate-4u.com."},
    {"key": "cacheUrl", "env": "CACHE_URL", "also": ["REDIS_URL"], "setting": "", "public": False, "secret": True, "group": "Server", "label": "Shared cache address", "hint": "Redis address. The server picks this up the next time it starts."},
    {"key": "secretKey", "env": "SECRET_KEY", "setting": "SECRET_KEY", "public": False, "secret": True, "group": "Server", "label": "Server signing key", "hint": "Signs sessions and cookies."},
    {"key": "debug", "env": "DEBUG", "setting": "DEBUG", "public": False, "secret": False, "group": "Server", "label": "Debug mode", "hint": "True or False. Keep False on the live site."},
    {"key": "databaseUrl", "env": "DATABASE_URL", "setting": "", "public": False, "secret": True, "group": "Server", "label": "Database address", "hint": "The server picks up a new database address the next time it starts."},
    {"key": "publicBackendUrl", "env": "PUBLIC_BACKEND_URL", "setting": "PUBLIC_BACKEND_URL", "public": False, "secret": False, "group": "Server", "label": "Public backend address", "hint": "Used in links inside emails that point at the server."},
    {"key": "celeryBrokerUrl", "env": "CELERY_BROKER_URL", "setting": "CELERY_BROKER_URL", "public": False, "secret": True, "group": "Server", "label": "Background job broker", "hint": "Redis address for background jobs."},
    {"key": "celeryResultBackend", "env": "CELERY_RESULT_BACKEND", "setting": "CELERY_RESULT_BACKEND", "public": False, "secret": True, "group": "Server", "label": "Background job results", "hint": "Where finished background jobs store their result."},
    {"key": "celeryTaskAlwaysEager", "env": "CELERY_TASK_ALWAYS_EAGER", "setting": "CELERY_TASK_ALWAYS_EAGER", "public": False, "secret": False, "group": "Server", "label": "Run jobs immediately", "hint": "True on Vercel. False when a separate worker runs jobs."},
    {"key": "celeryTaskEagerPropagates", "env": "CELERY_TASK_EAGER_PROPAGATES", "setting": "CELERY_TASK_EAGER_PROPAGATES", "public": False, "secret": False, "group": "Server", "label": "Show job errors immediately", "hint": "True or False."},
    {"key": "celeryTimezone", "env": "CELERY_TIMEZONE", "setting": "CELERY_TIMEZONE", "public": False, "secret": False, "group": "Server", "label": "Job timezone", "hint": "Usually UTC."},
    {"key": "localNetworkIp", "env": "LOCAL_NETWORK_IP", "setting": "LOCAL_NETWORK_IP", "public": False, "secret": False, "group": "Server", "label": "Local network address", "hint": "Allowed host for development."},
    {"key": "djangoCacheKeyPrefix", "env": "DJANGO_CACHE_KEY_PREFIX", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Cache key prefix", "hint": "The server picks this up the next time it starts.", "fallback": "mls-v2"},
    {"key": "djangoCacheTimeout", "env": "DJANGO_CACHE_TIMEOUT", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Cache timeout", "hint": "Seconds. The server picks this up the next time it starts.", "fallback": "300"},
    {"key": "dailyNewsletterBeatEnabled", "env": "DAILY_NEWSLETTER_BEAT_ENABLED", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Daily newsletter schedule", "hint": "1 turns it on. The server picks this up the next time it starts.", "fallback": "0"},
    {"key": "dailyNewsletterHourUtc", "env": "DAILY_NEWSLETTER_HOUR_UTC", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Newsletter hour", "hint": "Hour in UTC.", "fallback": "11"},
    {"key": "dailyNewsletterMinuteUtc", "env": "DAILY_NEWSLETTER_MINUTE_UTC", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Newsletter minute", "hint": "Minute in UTC.", "fallback": "0"},
    {"key": "homepageBeatEnabled", "env": "HOMEPAGE_BEAT_ENABLED", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Homepage refresh schedule", "hint": "1 turns it on. The server picks this up the next time it starts.", "fallback": "0"},
    {"key": "savedSearchAlertsBeatEnabled", "env": "SAVED_SEARCH_ALERTS_BEAT_ENABLED", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Saved-search alert schedule", "hint": "1 turns it on. The server picks this up the next time it starts.", "fallback": "0"},
    {"key": "savedSearchAlertsHourUtc", "env": "SAVED_SEARCH_ALERTS_HOUR_UTC", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Saved-search alert hour", "hint": "Hour in UTC.", "fallback": "12"},
    {"key": "savedSearchAlertsMinuteUtc", "env": "SAVED_SEARCH_ALERTS_MINUTE_UTC", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Saved-search alert minute", "hint": "Minute in UTC.", "fallback": "30"},
    {"key": "soldTrendsWarmBeatEnabled", "env": "SOLD_TRENDS_WARM_BEAT_ENABLED", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Market trends warm-up", "hint": "1 turns it on. Needs the shared cache. The server picks this up the next time it starts.", "fallback": "0"},
    {"key": "openaiBaseUrl", "env": "OPENAI_BASE_URL", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Gemini address", "hint": "https://generativelanguage.googleapis.com/v1beta/openai"},
    {"key": "openaiSearchModel", "env": "OPENAI_SEARCH_MODEL", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Search model", "hint": "gemini-3.8-flash"},
    {"key": "openaiSummaryModel", "env": "OPENAI_SUMMARY_MODEL", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Summary model", "hint": "gemini-3.8-flash"},
    {"key": "openaiEmbeddingModel", "env": "OPENAI_EMBEDDING_MODEL", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Embedding model", "hint": "gemini-embedding-001. Re-embed listings after changing this."},
    {"key": "openaiEmbeddingDimensions", "env": "OPENAI_EMBEDDING_DIMENSIONS", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Embedding size", "hint": "512. Must match the vectors already stored, or listings must be re-embedded."},
    {"key": "aiAssistAnonRate", "env": "AI_ASSIST_ANON_RATE", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Assistant limit for guests", "hint": "The server picks this up the next time it starts.", "fallback": "20/hour"},
    {"key": "aiAssistUserRate", "env": "AI_ASSIST_USER_RATE", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Assistant limit for members", "hint": "The server picks this up the next time it starts.", "fallback": "60/hour"},
    {"key": "aiSearchAnonRate", "env": "AI_SEARCH_ANON_RATE", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Search limit for guests", "hint": "The server picks this up the next time it starts.", "fallback": "30/hour"},
    {"key": "aiSearchUserRate", "env": "AI_SEARCH_USER_RATE", "setting": "", "public": False, "secret": False, "group": "AI", "label": "Search limit for members", "hint": "The server picks this up the next time it starts.", "fallback": "120/hour"},
    {"key": "estateCloudinaryPickerPrefix", "env": "ESTATE_CLOUDINARY_PICKER_PREFIX", "setting": "", "public": False, "secret": False, "group": "Photos", "label": "Photo folder prefix", "hint": ""},
    {"key": "estateDocumentAccessMaxAge", "env": "ESTATE_DOCUMENT_ACCESS_MAX_AGE", "setting": "ESTATE_DOCUMENT_ACCESS_MAX_AGE", "public": False, "secret": False, "group": "Photos", "label": "Document link lifetime", "hint": "Seconds."},
    {"key": "estateDocumentMaxBytes", "env": "ESTATE_DOCUMENT_MAX_BYTES", "setting": "ESTATE_DOCUMENT_MAX_BYTES", "public": False, "secret": False, "group": "Photos", "label": "Document size limit", "hint": "Bytes."},
    {"key": "featuredCacheTtlSeconds", "env": "FEATURED_CACHE_TTL_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Featured listings cache", "hint": "Seconds.", "fallback": "300"},
    {"key": "listingCacheTtlSeconds", "env": "LISTING_CACHE_TTL_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Listing cache", "hint": "Seconds.", "fallback": "86400"},
    {"key": "mapViewCacheTtlSeconds", "env": "MAP_VIEW_CACHE_TTL_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Map cache", "hint": "Seconds.", "fallback": "900"},
    {"key": "mapGeocoderUserAgent", "env": "MAP_GEOCODER_USER_AGENT", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Map geocoder name", "hint": "", "fallback": "MLSMapSearch/1.0"},
    {"key": "nearestSchoolCacheTtlSeconds", "env": "NEAREST_SCHOOL_CACHE_TTL_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "School lookup cache", "hint": "Seconds.", "fallback": "86400"},
    {"key": "recommendationCacheTtlSeconds", "env": "RECOMMENDATION_CACHE_TTL_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Recommendation cache", "hint": "Seconds.", "fallback": "300"},
    {"key": "maxSavedSearchesPerUser", "env": "MAX_SAVED_SEARCHES_PER_USER", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Saved searches per member", "hint": "", "fallback": "1"},
    {"key": "newsletterMaxPerSection", "env": "NEWSLETTER_MAX_PER_SECTION", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Newsletter items per section", "hint": "", "fallback": "5"},
    {"key": "recEnableCollab", "env": "REC_ENABLE_COLLAB", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Similar-buyer recommendations", "hint": "1 on, 0 off.", "fallback": "1"},
    {"key": "recEnablePersonal", "env": "REC_ENABLE_PERSONAL", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Personal recommendations", "hint": "1 on, 0 off.", "fallback": "1"},
    {"key": "recWeightCollab", "env": "REC_WEIGHT_COLLAB", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Similar-buyer weight", "hint": "", "fallback": "0.10"},
    {"key": "recWeightContent", "env": "REC_WEIGHT_CONTENT", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Listing-match weight", "hint": "", "fallback": "0.55"},
    {"key": "recWeightFreshness", "env": "REC_WEIGHT_FRESHNESS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Freshness weight", "hint": "", "fallback": "0.05"},
    {"key": "recWeightPersonal", "env": "REC_WEIGHT_PERSONAL", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Personal weight", "hint": "", "fallback": "0.30"},
    {"key": "smokeBaseUrl", "env": "SMOKE_BASE_URL", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Smoke test address", "hint": "Used by the deploy check, not by the live site.", "fallback": "http://localhost:8000"},
    {"key": "smokeTestEmail", "env": "SMOKE_TEST_EMAIL", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Smoke test email", "hint": ""},
    {"key": "smokeTestPassword", "env": "SMOKE_TEST_PASSWORD", "setting": "", "public": False, "secret": True, "group": "Advanced", "label": "Smoke test password", "hint": ""},
    {"key": "smokeTimeoutSeconds", "env": "SMOKE_TIMEOUT_SECONDS", "setting": "", "public": False, "secret": False, "group": "Advanced", "label": "Smoke test timeout", "hint": "Seconds.", "fallback": "25"},
)
_CASTS = {
    "DEBUG": lambda value: value == "True",
    "CELERY_TASK_ALWAYS_EAGER": lambda value: value == "True",
    "CELERY_TASK_EAGER_PROPAGATES": lambda value: value == "True",
    "EMAIL_USE_TLS": lambda value: value == "True",
    "EMAIL_PORT": int,
    "EMAIL_VERIFICATION_EXPIRY_HOURS": int,
    "ESTATE_IMAGE_MAX_UPLOAD_MB": int,
    "PRECON_ASSET_MAX_UPLOAD_MB": int,
    "ESTATE_DOCUMENT_ACCESS_MAX_AGE": int,
    "ESTATE_DOCUMENT_MAX_BYTES": int,
    "SENDGRID_TIMEOUT_SECONDS": int,
}

_BY_KEY = {field["key"]: field for field in FIELDS}
_CACHE: dict = {"at": 0.0, "values": {}}
_TTL = 15.0


def field_keys() -> set[str]:
    return set(_BY_KEY)


def stored_values() -> dict[str, str]:
    now = time.monotonic()
    if now - _CACHE["at"] < _TTL:
        return _CACHE["values"]
    values: dict[str, str] = {}
    try:
        from homepage.models import IntegrationSettings

        row = IntegrationSettings.objects.order_by("id").first()
        raw = row.values if row and isinstance(row.values, dict) else {}
        for key in _BY_KEY:
            value = raw.get(key)
            if isinstance(value, str) and value.strip():
                values[key] = value.strip()
    except (OperationalError, ProgrammingError):
        values = {}
    _CACHE["at"] = now
    _CACHE["values"] = values
    return values


def invalidate() -> None:
    _CACHE["at"] = 0.0
    _CACHE["values"] = {}


def configured(key: str) -> str:
    stored = stored_values().get(key, "")
    if stored:
        return stored
    import os

    field = _BY_KEY[key]
    from_env = ""
    for name in [field["env"], *field.get("also", [])]:
        from_env = os.environ.get(name, "").strip()
        if from_env:
            break
    if from_env:
        return from_env
    attr = _BY_KEY[key]["setting"]
    if not attr:
        return ""
    current = getattr(settings, attr, "")
    if isinstance(current, bool):
        return "True" if current else "False"
    if current is None:
        return ""
    return str(current).strip()


def effective(key: str) -> str:
    found = configured(key)
    if found:
        return found
    return str(_BY_KEY[key].get("fallback", "")).strip()


def apply_overlay() -> None:
    """Copy saved values onto the process so existing settings reads pick them up."""
    import os

    saved = stored_values()
    for field in FIELDS:
        value = saved.get(field["key"], "")
        if not value:
            continue
        names = [field["env"], *field.get("also", [])]
        for name in names:
            os.environ[name] = value
        attr = field["setting"]
        if not attr:
            continue
        cast = _CASTS.get(field["env"])
        try:
            setattr(settings, attr, cast(value) if cast else value)
        except (TypeError, ValueError):
            setattr(settings, attr, value)
    cloud = getattr(settings, "CLOUDINARY", None)
    if isinstance(cloud, dict):
        name = saved.get("cloudinaryCloudName", "")
        api_key = saved.get("cloudinaryApiKey", "")
        secret = saved.get("cloudinaryApiSecret", "")
        if name:
            cloud["CLOUD_NAME"] = name
        if api_key:
            cloud["API_KEY"] = api_key
        if secret:
            cloud["API_SECRET"] = secret


def status_for(key: str, saved: dict[str, str]) -> str:
    if saved.get(key):
        return "console"
    if configured(key):
        return "server"
    if _BY_KEY[key].get("fallback"):
        return "default"
    return "empty"


def public_payload() -> dict[str, str]:
    apply_overlay()
    return {field["key"]: effective(field["key"]) for field in FIELDS if field["public"]}


def staff_payload() -> dict:
    apply_overlay()
    saved = stored_values()
    groups: list[str] = []
    fields = []
    for field in FIELDS:
        if field["group"] not in groups:
            groups.append(field["group"])
        value = effective(field["key"])
        fields.append({
            "key": field["key"],
            "env": field["env"],
            "label": field["label"],
            "hint": field["hint"],
            "group": field["group"],
            "secret": field["secret"],
            "value": value,
            "status": status_for(field["key"], saved),
        })
    return {"groups": groups, "fields": fields}


def save_values(incoming: dict, clear: list[str] | None = None) -> dict[str, str]:
    from homepage.models import IntegrationSettings

    row, _ = IntegrationSettings.objects.get_or_create(pk=1, defaults={"values": {}})
    current = dict(row.values) if isinstance(row.values, dict) else {}
    for key in clear or []:
        if key in _BY_KEY:
            current.pop(key, None)
    for key, raw in incoming.items():
        if key not in _BY_KEY or not isinstance(raw, str):
            continue
        value = raw.strip()
        if value:
            current[key] = value[:8000]
        else:
            current.pop(key, None)
    row.values = current
    row.save(update_fields=["values", "updated_at"])
    invalidate()
    apply_overlay()
    return {key: value for key, value in current.items() if key in _BY_KEY}
