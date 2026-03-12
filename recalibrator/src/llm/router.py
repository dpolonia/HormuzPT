import os
import logging

MODEL_MAP = {
    "openai": {
        "baixo": os.getenv("OPENAI_MODEL_BAIXO", "gpt-5-mini-2025-08-07"),
        "moderado": os.getenv("OPENAI_MODEL_MODERADO", "gpt-5.4-2026-03-05"),
        "intenso": os.getenv("OPENAI_MODEL_INTENSO", "gpt-5.4-pro-2026-03-05"),
    },
    "anthropic": {
        "baixo": os.getenv("ANTHROPIC_MODEL_BAIXO", "claude-haiku-4-5"),
        "moderado": os.getenv("ANTHROPIC_MODEL_MODERADO", "claude-sonnet-4-6"),
        "intenso": os.getenv("ANTHROPIC_MODEL_INTENSO", "claude-opus-4-6"),
    },
    "vertex": {
        "baixo": os.getenv("VERTEX_MODEL_BAIXO", "gemini-3.1-flash-lite-preview"),
        "moderado": os.getenv("VERTEX_MODEL_MODERADO", "gemini-3-flash-preview"),
        "intenso": os.getenv("VERTEX_MODEL_INTENSO", "gemini-3.1-pro-preview"),
    }
}

def infer_tier_from_model(model: str) -> str:
    for provider, tiers in MODEL_MAP.items():
        for tier, m in tiers.items():
            if m == model:
                return tier
    return "moderado"

def infer_provider_from_model(model: str) -> str:
    for provider, tiers in MODEL_MAP.items():
        for tier, m in tiers.items():
            if m == model:
                return provider
    return "openai"

def default_tier_for_env(env: str) -> str:
    if env == "development":
        return "baixo"
    elif env == "test":
        return "moderado"
    elif env == "production":
        return "intenso"
    else:
        return "baixo"

def _tier_rank(tier: str) -> int:
    if tier == "intenso": return 3
    if tier == "moderado": return 2
    return 1 # baixo

def min_tier(t1: str, t2: str) -> str:
    return t1 if _tier_rank(t1) <= _tier_rank(t2) else t2

def max_tier(t1: str, t2: str) -> str:
    return t1 if _tier_rank(t1) >= _tier_rank(t2) else t2

def apply_task_defaults(current_tier: str, task_type: str, user_facing: bool) -> str:
    # frontend Q&A should default to Moderado
    if task_type == "frontend_qa":
        return "moderado"

    if task_type in ["long_context_reasoning", "long_context_synthesis"]:
        return "intenso"

    # cheap backoffice and background jobs default to Baixo
    if task_type in ["backoffice_analysis", "background_job", "simple_extraction", "summarization"]:
        return min_tier(current_tier, "baixo")

    # normal recalibration starts at Moderado
    if task_type == "recalibration":
        return max_tier(current_tier, "moderado")

    return current_tier

def adjust_tier_by_complexity(current_tier: str, complexity: str, env: str, task_type: str, user_facing: bool) -> str:
    if complexity == "low":
        # low complexity can stay cheap, especially if not user-facing
        if not user_facing:
            return min_tier(current_tier, "baixo")
        return current_tier

    if complexity == "medium":
        return max_tier(current_tier, "moderado")

    if complexity == "high":
        # High complexity should escalate
        return max_tier(current_tier, "intenso")

    return current_tier

def apply_cost_latency_policy(current_tier: str, env: str, task_type: str, user_facing: bool, latency_sensitive: bool) -> str:
    # development stays cheap by default
    if env == "development" and not user_facing:
        return min_tier(current_tier, "baixo")

    # backoffice and background tasks should remain cheaper unless clearly high-complexity
    if task_type in ["backoffice_analysis", "background_job", "simple_extraction", "summarization"] and not user_facing:
        return min_tier(current_tier, "baixo")

    # frontend Q&A should avoid Intenso by default unless really needed
    if task_type == "frontend_qa" and user_facing:
        return min_tier(current_tier, "moderado")

    # latency-sensitive requests prefer Moderado/Baixo
    if latency_sensitive and current_tier == "intenso":
        return "moderado"

    return current_tier

def get_provider_priority_for_tier(tier: str) -> list[str]:
    if tier == "intenso":
        return ["openai", "anthropic", "vertex"]
    elif tier == "moderado":
        return ["openai", "anthropic", "vertex"]
    elif tier == "baixo":
        return ["openai", "anthropic", "vertex"]
    else:
        return ["openai", "anthropic", "vertex"]

def get_model_for(provider: str, tier: str) -> str:
    return MODEL_MAP[provider][tier]

def provider_is_available(provider: str) -> bool:
    if provider == "openai" and os.getenv("OPENAI_API_KEY"):
        return True
    if provider == "anthropic" and os.getenv("ANTHROPIC_API_KEY") and os.getenv("ANTHROPIC_API_KEY") != "stub":
        return True
    if provider == "vertex" and os.getenv("VERTEX_AI_API_KEY"):
        return True
    return False

def model_is_available(provider: str, model: str) -> bool:
    # Assuming if provider is available, model is available for this proxy setup
    return True

def allow_tier_downgrade() -> bool:
    return os.getenv("LLM_ALLOW_TIER_DOWNGRADE", "true").lower() == "true"

def next_lower_tier(tier: str) -> str | None:
    if tier == "intenso":
        return "moderado"
    if tier == "moderado":
        return "baixo"
    return None

def resolve_llm_route(
    env,                    # development | test | production
    task_type,              # frontend_qa | backoffice_analysis | recalibration | summarization | extraction | background_job
    complexity,             # low | medium | high
    user_facing,            # True | False
    latency_sensitive,      # True | False
    explicit_tier=None,     # baixo | moderado | intenso
    explicit_provider=None, # openai | anthropic | vertex
    explicit_model=None     # exact model name
):
    # 1. Explicit hard override wins
    if explicit_model:
        return {
            "tier": explicit_tier or infer_tier_from_model(explicit_model),
            "provider": explicit_provider or infer_provider_from_model(explicit_model),
            "model": explicit_model,
            "reason": "explicit_model_override"
        }

    # 2. Start from environment default
    tier = default_tier_for_env(env)

    # 3. Task-specific defaults may refine the starting point
    tier = apply_task_defaults(tier, task_type, user_facing)

    # 4. Complexity may adjust tier up or down
    tier = adjust_tier_by_complexity(
        current_tier=tier,
        complexity=complexity,
        env=env,
        task_type=task_type,
        user_facing=user_facing
    )

    # 5. Latency / cost controls may keep non-critical tasks cheaper
    tier = apply_cost_latency_policy(
        current_tier=tier,
        env=env,
        task_type=task_type,
        user_facing=user_facing,
        latency_sensitive=latency_sensitive
    )

    # 6. Explicit tier override, if present, takes precedence after policy calculation
    if explicit_tier:
        tier = explicit_tier

    # 7. Choose provider order for the final tier
    provider_order = get_provider_priority_for_tier(tier)

    # 8. If explicit provider is requested, try it first
    if explicit_provider:
        provider_order = [explicit_provider] + [p for p in provider_order if p != explicit_provider]

    # 9. Select first available provider/model in same tier
    for provider in provider_order:
        model = get_model_for(provider, tier)
        if provider_is_available(provider) and model_is_available(provider, model):
            return {
                "tier": tier,
                "provider": provider,
                "model": model,
                "reason": "policy_selected"
            }

    # 10. Same-tier providers failed: downgrade only if allowed
    if allow_tier_downgrade():
        if explicit_tier == "intenso" or complexity == "high" or tier == "intenso":
            logging.warning(f"[LLMRouter] Unavoidable tier downgrade from {tier}. Explicit high-tier requested.")
        lower_tier = next_lower_tier(tier)
        if lower_tier:
            for provider in get_provider_priority_for_tier(lower_tier):
                model = get_model_for(provider, lower_tier)
                if provider_is_available(provider) and model_is_available(provider, model):
                    return {
                        "tier": lower_tier,
                        "provider": provider,
                        "model": model,
                        "reason": "tier_downgrade_fallback"
                    }

    raise RuntimeError("No LLM route available")

def resolve_recalibration_route(env: str, complexity: str) -> dict:
    tier = default_tier_for_env(env)

    # recalibration should not be below Moderado
    if tier == "baixo":
        tier = "moderado"

    if complexity == "high":
        tier = "intenso"

    provider_order = ["vertex", "openai", "anthropic"]

    for provider in provider_order:
        model = get_model_for(provider, tier)
        if provider_is_available(provider) and model_is_available(provider, model):
            return {
                "tier": tier,
                "provider": provider,
                "model": model,
                "reason": "recalibration_policy"
            }

    raise RuntimeError("No recalibration route available")

def resolve_frontend_qa_route(env: str, complexity: str) -> dict:
    route = resolve_llm_route(
        env=env,
        task_type="frontend_qa",
        complexity=complexity,
        user_facing=True,
        latency_sensitive=True
    )

    # never silently exceed Moderado unless explicit escalation
    if route["tier"] == "intenso":
        route = {
            "tier": "moderado",
            "provider": "openai",
            "model": "gpt-5.4-2026-03-05",
            "reason": "frontend_default_capped_to_moderado"
        }

    return route

# Backwards compatibility handler for the pipeline
def get_model(task: str, provider_index: int = 0) -> tuple[str, str, str]:
    env = os.getenv("HORMUZ_ENV", "development")
    
    if task in ["recalibration", "recalibration_complex"]:
        complexity = "high" if task == "recalibration_complex" else "medium"
        route = resolve_recalibration_route(env, complexity)
    else:
        # Map old tasks to new structure
        task_type = "frontend_qa" if task == "frontend_qa" else task
        route = resolve_llm_route(
            env=env,
            task_type=task_type,
            complexity="medium",
            user_facing=False,
            latency_sensitive=False
        )
    
    return route["provider"], route["model"], route["tier"]
