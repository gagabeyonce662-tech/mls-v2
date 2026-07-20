#!/usr/bin/env python3
"""
Phase 1 production smoke checks for the Django backend.

Designed for transparent CI diagnostics:
- method/path/status/latency/content-type
- compact response snippets
- explicit assertion failures
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib import error, parse, request


BASE_URL = os.environ.get("SMOKE_BASE_URL", "http://localhost:8000").rstrip("/")
SMOKE_EMAIL = os.environ.get("SMOKE_TEST_EMAIL", "").strip()
SMOKE_PASSWORD = os.environ.get("SMOKE_TEST_PASSWORD", "").strip()
TIMEOUT_SECONDS = int(os.environ.get("SMOKE_TIMEOUT_SECONDS", "25"))


@dataclass
class HttpResult:
    method: str
    path: str
    url: str
    status: int
    elapsed_ms: int
    headers: dict[str, str]
    body_text: str
    body_json: Any | None


def _compact(value: Any) -> str:
    if isinstance(value, (dict, list)):
        raw = json.dumps(value, ensure_ascii=True, separators=(",", ":"))
    else:
        raw = str(value)
    return raw[:380] + ("..." if len(raw) > 380 else "")


def _request(method: str, path: str, payload: dict[str, Any] | None = None, token: str | None = None) -> HttpResult:
    url = f"{BASE_URL}{path}"
    headers: dict[str, str] = {"Accept": "application/json, text/html;q=0.9, */*;q=0.8"}
    data = None

    if payload is not None:
        encoded = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
        data = encoded
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = request.Request(url=url, method=method.upper(), data=data, headers=headers)
    started = time.monotonic()
    try:
        with request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body_bytes = resp.read()
            status = resp.getcode()
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
    except error.HTTPError as exc:
        body_bytes = exc.read() or b""
        status = exc.code
        resp_headers = {k.lower(): v for k, v in (exc.headers.items() if exc.headers else [])}
    elapsed_ms = int((time.monotonic() - started) * 1000)

    body_text = body_bytes.decode("utf-8", errors="replace")
    body_json = None
    if body_text:
        try:
            body_json = json.loads(body_text)
        except json.JSONDecodeError:
            body_json = None

    return HttpResult(
        method=method.upper(),
        path=path,
        url=url,
        status=status,
        elapsed_ms=elapsed_ms,
        headers=resp_headers,
        body_text=body_text,
        body_json=body_json,
    )


def _log_result(name: str, result: HttpResult) -> None:
    print(
        json.dumps(
            {
                "check": name,
                "method": result.method,
                "path": result.path,
                "status": result.status,
                "elapsed_ms": result.elapsed_ms,
                "content_type": result.headers.get("content-type", ""),
                "response_snippet": _compact(result.body_json if result.body_json is not None else result.body_text),
            },
            ensure_ascii=True,
        )
    )


def _expect_status(name: str, result: HttpResult, allowed: set[int]) -> list[str]:
    if result.status not in allowed:
        return [f"{name}: expected status in {sorted(allowed)}, got {result.status}"]
    return []


def _expect_html_markers(name: str, result: HttpResult, markers: list[str]) -> list[str]:
    text = (result.body_text or "").lower()
    if any(m.lower() in text for m in markers):
        return []
    return [f"{name}: expected one of HTML markers {markers}, but none found"]


def _expect_json_keys(name: str, result: HttpResult, keys: list[str]) -> list[str]:
    if not isinstance(result.body_json, dict):
        return [f"{name}: expected JSON object, got non-object body"]
    missing = [k for k in keys if k not in result.body_json]
    if missing:
        return [f"{name}: missing JSON keys {missing}"]
    return []


def _expect_top_level(name: str, result: HttpResult, allowed: set[str]) -> list[str]:
    if result.body_json is None:
        return [f"{name}: expected JSON top-level {sorted(allowed)}, got non-JSON body"]
    is_obj = isinstance(result.body_json, dict)
    is_arr = isinstance(result.body_json, list)
    kind = "object" if is_obj else "array" if is_arr else "other"
    if kind not in allowed:
        return [f"{name}: expected JSON top-level {sorted(allowed)}, got {kind}"]
    return []


def run() -> int:
    started_at = datetime.now(tz=timezone.utc).isoformat()
    print(json.dumps({"event": "smoke_start", "base_url": BASE_URL, "started_at": started_at}, ensure_ascii=True))

    failures: list[str] = []

    # 1) Admin login surfaces
    admin_checks = [
        ("admin_root", "/admin/"),
        ("admin_mls_property", "/admin/mls/property/"),
        ("admin_mls_property_add", "/admin/mls/property/add/"),
        ("admin_vlog_post", "/admin/vlog/vlogpost/"),
        ("admin_vlog_post_add", "/admin/vlog/vlogpost/add/"),
    ]
    for name, path in admin_checks:
        result = _request("GET", path)
        _log_result(name, result)
        failures.extend(_expect_status(name, result, {200, 301, 302}))
        failures.extend(_expect_html_markers(name, result, ["Django administration", "Log in | Django site admin"]))

    # 2) Auth flow
    if not SMOKE_EMAIL or not SMOKE_PASSWORD:
        failures.append("auth_login: SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD must be set")
        login_json = None
    else:
        login = _request(
            "POST",
            "/api/auth/login/",
            payload={"email": SMOKE_EMAIL, "password": SMOKE_PASSWORD},
        )
        _log_result("auth_login", login)
        failures.extend(_expect_status("auth_login", login, {200}))
        failures.extend(_expect_json_keys("auth_login", login, ["access", "refresh", "user"]))
        login_json = login.body_json if isinstance(login.body_json, dict) else None

    token = (login_json or {}).get("access") if isinstance(login_json, dict) else None
    refresh = (login_json or {}).get("refresh") if isinstance(login_json, dict) else None

    if refresh:
        refresh_result = _request("POST", "/api/auth/token/refresh/", payload={"refresh": refresh})
        _log_result("auth_refresh", refresh_result)
        failures.extend(_expect_status("auth_refresh", refresh_result, {200}))
        failures.extend(_expect_json_keys("auth_refresh", refresh_result, ["access"]))
    else:
        failures.append("auth_refresh: skipped because refresh token is unavailable")

    if token:
        profile = _request("GET", "/api/auth/profile/", token=token)
        _log_result("auth_profile", profile)
        failures.extend(_expect_status("auth_profile", profile, {200}))
        failures.extend(_expect_json_keys("auth_profile", profile, ["id", "email"]))
    else:
        failures.append("auth_profile: skipped because access token is unavailable")

    # 3) MLS reads
    read_checks = [
        ("mls_properties", "/api/mls/properties/"),
        ("mls_properties_filter", "/api/mls/properties/filter/?page=1"),
        ("mls_property_types", "/api/mls/properties/property-types/"),
        ("mls_map_aggregates", "/api/mls/properties/map-aggregates/"),
    ]
    for name, path in read_checks:
        result = _request("GET", path)
        _log_result(name, result)
        failures.extend(_expect_status(name, result, {200}))
        failures.extend(_expect_top_level(name, result, {"object", "array"}))

    # 4) Controlled write (tag-and-audit)
    tag = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    inquiry_payload = {
        "first_name": "Smoke",
        "last_name": "Gate",
        "email": f"smoke+{tag}@ravan.ai",
        "phone": "+1-000-000-0000",
        "intent": "buy",
        "message": f"Smoke test marker {tag} - verify inquiry endpoint and integrations.",
        "preferred_locations": "Toronto",
        "property_types": "Condo",
        "budget_min": 500000,
        "budget_max": 900000,
        "bedrooms_min": 2,
        "bathrooms_min": 2,
        "timeline": "3-6 months",
        "page_url": f"{BASE_URL}/smoke-test/{tag}",
    }
    inquiry = _request("POST", "/api/mls/inquiries/", payload=inquiry_payload)
    _log_result("mls_inquiry_create_tagged", inquiry)
    failures.extend(_expect_status("mls_inquiry_create_tagged", inquiry, {201}))
    failures.extend(_expect_json_keys("mls_inquiry_create_tagged", inquiry, ["id", "message"]))

    inquiry_id = None
    if isinstance(inquiry.body_json, dict):
        inquiry_id = inquiry.body_json.get("id")
    print(
        json.dumps(
            {
                "event": "cleanup_strategy",
                "mode": "tag_and_audit",
                "created_inquiry_id": inquiry_id,
                "tag": tag,
                "note": "Phase 1 does not hard-delete via API; purge tagged records via scheduled maintenance.",
            },
            ensure_ascii=True,
        )
    )

    completed_at = datetime.now(tz=timezone.utc).isoformat()
    if failures:
        print(json.dumps({"event": "smoke_failed", "failed_checks": failures, "completed_at": completed_at}, ensure_ascii=True))
        return 1

    print(json.dumps({"event": "smoke_passed", "completed_at": completed_at}, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    sys.exit(run())
