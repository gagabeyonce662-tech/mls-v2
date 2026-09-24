"""Celery entry points. Each wraps a plain job function (services/jobs.py) so
the same work can also run from ``refresh_homepage_feeds`` under cron."""

from celery import shared_task

from .services import jobs, news, subscriptions
from .services.feeds import refresh_market_snapshot


@shared_task
def ingest_news() -> dict:
    return news.ingest_all()


@shared_task
def refresh_market() -> bool:
    return bool(refresh_market_snapshot())


@shared_task
def refresh_sold_below_purchase() -> dict:
    return jobs.refresh_sold_below_purchase()


@shared_task
def send_nearby_alerts() -> dict:
    return subscriptions.send_nearby_alerts()
