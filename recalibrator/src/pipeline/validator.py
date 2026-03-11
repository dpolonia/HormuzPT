"""Validator — cross-validation of proposals against evidence."""

import logging

logger = logging.getLogger(__name__)

# Guardrails from CLAUDE.md §6.2
GUARDRAILS = {
    "auto_apply_max_pct": 5.0,     # ≤ ±5% → AUTO_APPLY
    "advisory_max_pct": 10.0,      # 5-10% → AUTO_APPLY + ADVISORY
    "human_review_above_pct": 10.0, # > ±10% → HUMAN_REVIEW
}


def classify_risk(change_pct: float) -> str:
    """Classify risk based on percentage change."""
    abs_pct = abs(change_pct)
    if abs_pct <= GUARDRAILS["auto_apply_max_pct"]:
        return "AUTO_APPLY"
    elif abs_pct <= GUARDRAILS["advisory_max_pct"]:
        return "ADVISORY"
    else:
        return "HUMAN_REVIEW"


async def validate(analysis: dict, evidence: dict) -> dict:
    """Validate proposed changes against evidence and classify risk."""
    # TODO: Implement with LLM (Intenso tier: gpt-5.4-pro → claude-opus → gemini-3.1-pro)
    logger.info("Validator: returning stub validation")

    changes = analysis.get("changes", [])
    if not changes:
        return {
            "risk_class": "AUTO_APPLY",
            "model_used": "stub",
            "validated": True,
        }

    # Determine overall risk class (worst of all changes)
    risk_classes = [classify_risk(c.get("change_pct", 0)) for c in changes]
    if "HUMAN_REVIEW" in risk_classes:
        overall = "HUMAN_REVIEW"
    elif "ADVISORY" in risk_classes:
        return {"risk_class": "ADVISORY", "model_used": "stub", "validated": True}
    else:
        overall = "AUTO_APPLY"

    return {
        "risk_class": overall,
        "model_used": "stub",
        "validated": True,
    }
