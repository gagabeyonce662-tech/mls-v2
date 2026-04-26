import requests
import re


DEFAULT_GEMINI_MODELS = (
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
)


class AISummaryGenerationError(Exception):
    pass


def build_summary_prompt(property_payload: dict) -> str:
    return "\n".join(
        [
            "You are a real-estate assistant.",
            "Summarize the listing in clean markdown format.",
            "Keep it concise, factual, and neutral.",
            "Return only markdown.",
            "",
            "Structure:",
            "## Snapshot",
            "- 4 to 6 bullets with price, type, beds/baths, size, area hints, status.",
            "## Highlights",
            "- 3 to 5 bullets from remarks/features only if present.",
            "## Considerations",
            "- 2 to 4 bullets of neutral caution points (missing info, verify facts).",
            "",
            f"Listing data: {property_payload}",
        ]
    )


def is_summary_complete(summary: str) -> bool:
    if not summary or len(summary.strip()) < 120:
        return False

    normalized = summary.lower()
    required_sections = ("## snapshot", "## highlights", "## considerations")
    if not all(section in normalized for section in required_sections):
        return False

    # Expect at least a few bullets across sections.
    bullet_count = len(re.findall(r"(?m)^\s*[-*]\s+", summary))
    if bullet_count < 5:
        return False

    # Avoid clearly cut-off markdown tails.
    if summary.rstrip().endswith(("- ", "* ", "**", "__", "#")):
        return False

    return True


def _extract_google_error(response: requests.Response) -> str:
    try:
        data = response.json()
        message = (
            data.get("error", {}).get("message")
            or data.get("message")
            or response.text
        )
        code = data.get("error", {}).get("code") or response.status_code
        status_name = data.get("error", {}).get("status")
        details = data.get("error", {}).get("details")
        detail_hint = ""
        if isinstance(details, list) and details:
            detail_hint = f" | details={details[0]}"
        if status_name:
            return f"[{code} {status_name}] {message}{detail_hint}"
        return f"[{code}] {message}{detail_hint}"
    except Exception:
        return f"[HTTP {response.status_code}] {response.text}"


def _generate_with_model(property_payload: dict, api_key: str, model: str) -> str:
    prompt = build_summary_prompt(property_payload)
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 500,
            },
        },
        timeout=30,
    )
    if not response.ok:
        raise AISummaryGenerationError(_extract_google_error(response))

    data = response.json()
    summary = "".join(
        part.get("text", "")
        for part in data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    ).strip()
    if not summary:
        raise AISummaryGenerationError("Gemini returned an empty summary.")
    if not is_summary_complete(summary):
        raise AISummaryGenerationError(
            "Gemini returned an incomplete summary. Please retry."
        )
    return summary


def generate_listing_summary(property_payload: dict, api_key: str) -> str:
    per_model_errors: list[str] = []
    for model in DEFAULT_GEMINI_MODELS:
        try:
            return _generate_with_model(property_payload, api_key, model)
        except AISummaryGenerationError as exc:
            per_model_errors.append(f"{model}: {str(exc)}")
            continue
        except requests.RequestException as exc:
            per_model_errors.append(f"{model}: network/request error: {str(exc)}")
            continue

    raise AISummaryGenerationError(
        "All configured Gemini models failed. "
        + " | ".join(per_model_errors[:8])
    )
