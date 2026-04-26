import requests


GEMINI_MODEL = "gemini-2.0-flash"


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


def generate_listing_summary(property_payload: dict, api_key: str) -> str:
    prompt = build_summary_prompt(property_payload)
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}",
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
    response.raise_for_status()
    data = response.json()
    summary = "".join(
        part.get("text", "")
        for part in data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    ).strip()
    if not summary:
        raise ValueError("Gemini returned an empty summary.")
    return summary
