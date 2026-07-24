import os

from upstash_redis import Redis


def get_redis_client():
    url = os.getenv("KV_REST_API_URL")
    token = os.getenv("KV_REST_API_TOKEN")

    if not url or not token:
        return None

    return Redis(
        url=url,
        token=token,
    )

import json


OPEN_HOUSES_CACHE_KEY = "mls:open-houses:v1"
OPEN_HOUSES_TTL_SECONDS = 1800


def get_cached_open_houses():
    redis = get_redis_client()

    if redis is None:
        return None

    cached = redis.get(OPEN_HOUSES_CACHE_KEY)

    if cached is None:
        return None

    return json.loads(cached)


def set_cached_open_houses(open_houses):
    redis = get_redis_client()

    if redis is None:
        return False

    redis.set(
        OPEN_HOUSES_CACHE_KEY,
        json.dumps(open_houses),
        ex=OPEN_HOUSES_TTL_SECONDS,
    )

    return True