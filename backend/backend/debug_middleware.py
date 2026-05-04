import json
import os
import platform
from datetime import datetime, timezone
from pathlib import Path

import django
from django.template.context import BaseContext, RequestContext


DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent / "debug-490580.log"


def _log_debug(hypothesis_id: str, message: str, data: dict) -> None:
    # Vercel serverless: /var/task is read-only; skip file logging.
    if os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV"):
        return
    payload = {
        "sessionId": "490580",
        "runId": "pre-fix",
        "hypothesisId": hypothesis_id,
        "location": "backend/debug_middleware.py",
        "message": message,
        "data": data,
        "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
    }
    with DEBUG_LOG_PATH.open("a", encoding="utf-8") as fp:
        fp.write(json.dumps(payload, ensure_ascii=True) + "\n")


class AdminContextDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/admin/mls/property/"):
            # region agent log
            _log_debug(
                "H1",
                "Runtime version matrix for admin request",
                {
                    "path": request.path,
                    "django_version": django.get_version(),
                    "python_version": platform.python_version(),
                },
            )
            # endregion

            # region agent log
            _log_debug(
                "H2",
                "Template context copy implementation origins",
                {
                    "base_context_copy_module": getattr(BaseContext.__copy__, "__module__", None),
                    "base_context_copy_qualname": getattr(BaseContext.__copy__, "__qualname__", None),
                    "request_context_copy_module": getattr(RequestContext.__copy__, "__module__", None),
                    "request_context_copy_qualname": getattr(RequestContext.__copy__, "__qualname__", None),
                },
            )
            # endregion

            # region agent log
            _log_debug(
                "H3",
                "Context class characteristics",
                {
                    "base_context_has_dict_attr": hasattr(BaseContext, "__dict__"),
                    "request_context_has_dict_attr": hasattr(RequestContext, "__dict__"),
                    "base_context_slots": getattr(BaseContext, "__slots__", None),
                    "request_context_slots": getattr(RequestContext, "__slots__", None),
                },
            )
            # endregion

        return self.get_response(request)
