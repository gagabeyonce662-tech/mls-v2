from celery import shared_task

from mls.services.newsletter_notifications import send_daily_listing_newsletters


@shared_task
def run_daily_listing_newsletters() -> dict:
    return send_daily_listing_newsletters()
