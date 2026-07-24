import os

from upstash_redis import Redis


def get_redis_client():
    url = os.getenv("UPSTASH_REDIS_REST_URL")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    if not url or not token:
        return None

    return Redis(
        url=url,
        token=token,
    )