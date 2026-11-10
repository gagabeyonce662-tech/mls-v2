import re

from . import openai_client

# Unchanged by the Gemini -> OpenAI move: the prompt is the same, so summaries
# already cached under v2 stay valid and are not regenerated (or re-billed).
SUMMARY_PROMPT_VERSION = "v2"
# Room for reasoning models, whose hidden reasoning counts against this cap.
SUMMARY_MAX_TOKENS = 1500


class AISummaryGenerationError(Exception):
    pass


def build_summary_prompt(property_payload: dict) -> str:
    listing_kind = property_payload.get("transaction_type") or "sale"
    cost_section = (
        "## Costs and conditions\n"
        "- List the advertised rent, frequency, utilities, parking, deposits, promotions, "
        "availability, and lease terms only when explicitly stated.\n"
        "- Put unclear or incomplete costs under 'Verify before deciding'."
        if listing_kind == "rent"
        else "## Ownership costs and conditions\n"
        "- List price, taxes, fees, parking, and other costs only when explicitly stated.\n"
        "- Put unclear or incomplete costs under 'Verify before deciding'."
    )
    return "\n".join(
        [
            "You are a careful real-estate listing assistant.",
            "Create a concise, decision-useful brief from the supplied listing data.",
            "Never invent facts, prices, fees, availability, neighbourhood claims, or inferences.",
            "Use only supplied facts. Treat marketing language as a claim, not a verified fact.",
            "State missing or unclear information as something to verify; do not guess.",
            "Return only markdown.",
            "",
            f"Listing type: {listing_kind}",
            "Required structure:",
            "## Snapshot",
            "- 3 to 5 bullets covering the core factual details available (price/rent, type, beds/baths, size, location, status).",
            "## Confirmed listing facts",
            "- 3 to 6 bullets drawn directly from listing fields or public remarks.",
            cost_section,
            "## Verify before deciding",
            "- 2 to 5 concrete unknowns, qualifiers, or costs that should be confirmed. Never claim a fact is missing if it is supplied.",
            "## Questions to ask",
            "- 2 to 4 concise questions tailored to missing information or conditions in this listing.",
            "",
            f"Listing data: {property_payload}",
        ]
    )


def is_summary_complete(summary: str) -> bool:
    if not summary or len(summary.strip()) < 120:
        return False

    normalized = summary.lower()
    required_sections = (
        "## snapshot",
        "## confirmed listing facts",
        "## verify before deciding",
        "## questions to ask",
    )
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


def _generate_with_model(property_payload: dict, model: str) -> str:
    result = openai_client.chat(
        [{"role": "user", "content": build_summary_prompt(property_payload)}],
        model=model,
        max_tokens=SUMMARY_MAX_TOKENS,
        timeout=30,
    )
    summary = result.content.strip()
    if not is_summary_complete(summary):
        raise AISummaryGenerationError("OpenAI returned an incomplete summary. Please retry.")
    return summary


def generate_listing_summary(property_payload: dict) -> str:
    """Summary from the first ``OPENAI_SUMMARY_MODEL`` entry that succeeds."""
    per_model_errors: list[str] = []
    for model in openai_client.summary_models():
        try:
            return _generate_with_model(property_payload, model)
        except (AISummaryGenerationError, openai_client.OpenAIError) as exc:
            per_model_errors.append(f"{model}: {exc}")

    raise AISummaryGenerationError(
        "All configured OpenAI models failed. " + " | ".join(per_model_errors[:8])
    )
