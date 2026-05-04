import json
import os
from datetime import datetime, timezone
from pathlib import Path


DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent.parent / "debug-e55290.log"


def _log_debug(hypothesis_id: str, message: str, data: dict) -> None:
    if os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL_ENV"):
        return
    payload = {
        "sessionId": "e55290",
        "runId": "pre-fix-caret-server",
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
        response = self.get_response(request)
        if "/admin/mls/property/" not in request.path:
            return response

        content_type = response.get("Content-Type", "")
        body_text = ""
        if "text/html" in content_type and hasattr(response, "content"):
            try:
                body_text = response.content.decode("utf-8", errors="ignore")
            except Exception:
                body_text = ""

        css_path = Path(__file__).resolve().parent.parent / "static" / "admin" / "css" / "sectioned-admin.css"
        css_text = ""
        if css_path.exists():
            try:
                css_text = css_path.read_text(encoding="utf-8")
            except Exception:
                css_text = ""

        _log_debug(
            "C5",
            "Caret rule presence snapshot",
            {
                "path": request.path,
                "status_code": response.status_code,
                "has_wp_editor_root": "wp-admin-editor" in body_text,
                "has_inline_border_patch": "data-wp-border-patch" in body_text,
                "css_has_caret_color_rule": "caret-color" in css_text,
                "css_has_text_color_rule": ".wp-admin-editor input" in css_text and "color:" in css_text,
                "css_has_padding_left_rule": "padding-left" in css_text,
                "css_has_text_indent_rule": "text-indent" in css_text,
                "css_has_inset_shadow_rule": "inset 0 0 0 1px" in css_text,
                "inline_patch_sets_padding_left": "setProperty(\"padding-left\"" in body_text,
                "inline_patch_sets_text_indent": "setProperty(\"text-indent\"" in body_text,
            },
        )
        return response
