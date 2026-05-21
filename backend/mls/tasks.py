from celery import shared_task

from mls.services.newsletter_notifications import send_daily_listing_newsletters
from mls.services.amplify_sold import run_amplify_sold_sync


@shared_task
def run_daily_listing_newsletters() -> dict:
    return send_daily_listing_newsletters()


@shared_task
def run_amplify_sold_sync_task() -> dict:
    result = run_amplify_sold_sync()
    return {
        "fetched": result.fetched,
        "upserted": result.upserted,
        "skipped": result.skipped,
        "watermark": result.watermark.isoformat() if result.watermark else None,
    }
