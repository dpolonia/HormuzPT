"""OpenAI LLM client stub."""

from ..config import settings


async def call_openai(
    model: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
) -> dict:
    """Call OpenAI API. Stub — returns placeholder."""
    # TODO: Implement with openai SDK
    # import openai
    # client = openai.OpenAI(api_key=settings.openai_api_key)
    return {
        "provider": "openai",
        "model": model,
        "content": f"[Stub] OpenAI {model} response pending implementation",
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_usd": 0.0,
    }
