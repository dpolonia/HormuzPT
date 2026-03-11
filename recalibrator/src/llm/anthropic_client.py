"""Anthropic LLM client stub."""

from ..config import settings


async def call_anthropic(
    model: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
) -> dict:
    """Call Anthropic API. Stub — returns placeholder."""
    # TODO: Implement with anthropic SDK
    # import anthropic
    # client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return {
        "provider": "anthropic",
        "model": model,
        "content": f"[Stub] Anthropic {model} response pending implementation",
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_usd": 0.0,
    }
