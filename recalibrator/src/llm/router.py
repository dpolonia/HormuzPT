"""LLM router with tier-based routing per CLAUDE.md §5."""

from ..config import settings

# Tier definitions
TIERS = {
    "intenso": {
        "anthropic": "claude-opus-4-6",
        "openai": "gpt-5.4-pro-2026-03-05",
        "vertex": "gemini-3.1-pro-preview",
    },
    "moderado": {
        "anthropic": "claude-sonnet-4-6",
        "openai": "gpt-5.4-2026-03-05",
        "vertex": "gemini-3-flash-preview",
    },
    "baixo": {
        "anthropic": "claude-haiku-4-5",
        "openai": "gpt-5-mini-2025-08-07",
        "vertex": "gemini-3.1-flash-lite-preview",
    },
}

# Task → tier + provider order
TASK_ROUTING: dict[str, dict] = {
    "weekly_analysis": {
        "tier": "intenso",
        "order": ["anthropic", "openai", "vertex"],
    },
    "recalibration_complex": {
        "tier": "intenso",
        "order": ["anthropic", "openai", "vertex"],
    },
    "recalibration_routine": {
        "tier": "moderado",
        "order": ["anthropic", "openai", "vertex"],
    },
    "scopus_search": {
        "tier": "moderado",
        "order": ["vertex", "anthropic", "openai"],
    },
    "cross_validation": {
        "tier": "intenso",
        "order": ["openai", "anthropic", "vertex"],
    },
    "changelog": {
        "tier": "intenso",
        "order": ["anthropic", "anthropic", "openai"],
    },
    "risk_classification": {
        "tier": "baixo",
        "order": ["anthropic", "openai", "vertex"],
    },
    "chat": {
        "tier": "moderado",
        "order": ["anthropic", "openai", "vertex"],
    },
}


def get_tier(task: str) -> str:
    """Get the tier for a task, with development downgrade."""
    routing = TASK_ROUTING.get(task, TASK_ROUTING["chat"])
    tier = routing["tier"]

    # In development, never use Intenso tier (downgrade to Moderado)
    if settings.is_development and tier == "intenso":
        tier = "moderado"

    return tier


def get_model(task: str, provider_index: int = 0) -> tuple[str, str, str]:
    """
    Get (provider, model_name, tier) for a task.
    provider_index: 0=primary, 1=fallback1, 2=fallback2
    """
    tier = get_tier(task)
    routing = TASK_ROUTING.get(task, TASK_ROUTING["chat"])
    providers = routing["order"]

    idx = min(provider_index, len(providers) - 1)
    provider = providers[idx]
    model = TIERS[tier][provider]

    return provider, model, tier
