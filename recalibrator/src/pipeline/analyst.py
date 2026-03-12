"""Analyst — Math-based data analysis and parameter adjustment proposals."""

import json
import logging
from ..llm.router import get_model
from ..llm.anthropic_client import AnthropicClient
from ..llm.openai_client import OpenAIClient
from ..llm.vertex_client import VertexClient

logger = logging.getLogger(__name__)

async def analyse(data: dict) -> dict:
    """Analyse collected data and propose parameter adjustments."""
    snapshots = data.get("snapshots", [])
    if not snapshots:
        logger.warning("Analyst: no data snapshots to analyse")
        return {
            "changes": [],
            "summary": "No data available",
            "model_used": "baseline-math",
        }

    try:
        # Use the most recent snapshot for analysis
        state = snapshots[0]
        base_gas = float(state.get("base_eff_gas", 0))
        base_die = float(state.get("base_eff_die", 0))
        logger.info("Analyst: analysing state with gas=%f, die=%f", base_gas, base_die)
        
        system_prompt = "You are a quantitative energy economist. Analyze the following model state and propose 0-2 parameter changes (elast_gas, elast_die, imp_co2) in valid JSON schema: {'changes': [{'parameter': '...', 'proposed_value': 0.0, 'reason': '...'}], 'summary': '...'}"
        prompt = json.dumps(state)
        
        # Try providers in order
        for idx in range(3):
            provider, model_name, tier = get_model("recalibration_complex", idx)
            logger.info(f"Analyst attempting LLM analysis via {provider} / {model_name} (tier: {tier})")
            
            try:
                if provider == "anthropic":
                    client = AnthropicClient()
                    result_text = client.analyze(prompt, system_prompt, model_name)
                elif provider == "openai":
                    client = OpenAIClient()
                    result_text = client.analyze(prompt, system_prompt, model_name)
                elif provider == "vertex":
                    client = VertexClient()
                    result_text = client.analyze(prompt, system_prompt, model_name)
                else:
                    continue
                    
                # Basic JSON extraction
                clean_json = result_text[result_text.find("{"):result_text.rfind("}")+1]
                parsed = json.loads(clean_json)
                parsed["model_used"] = model_name
                parsed["provider"] = provider
                parsed["tier"] = tier
                
                return parsed
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed: {e}")
                continue
                
    except (TypeError, ValueError, IndexError, AttributeError) as e:
        logger.error("Analyst: Schema error processing state data: %s", str(e))
        return {
            "changes": [],
            "summary": f"Data validation error: {str(e)}. Analysis aborted.",
            "model_used": "baseline-math",
            "error": True
        }
        
    return {
        "changes": [],
        "summary": "All LLM requests failed. No recalibration generated.",
        "model_used": "failed",
        "error": True
    }
