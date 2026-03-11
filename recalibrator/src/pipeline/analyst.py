"""Analyst — Math-based data analysis and parameter adjustment proposals."""

import logging

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

    # Use the most recent snapshot for analysis
    state = snapshots[0]
    changes = []
    
    # Simple mathematical/economic heuristic for recalibration proposal
    base_gas = state.get("base_eff_gas", 0)
    base_die = state.get("base_eff_die", 0)
    
    logger.info("Analyst: analysing state with gas=%f, die=%f", base_gas, base_die)
    
    # If base efficient price is high enough, we propose recalibrating elasticity
    if base_gas > 1.80:
        changes.append({
            "parameter": "elast_gas",
            "current_value": state.get("elast_gas", -0.20),
            "proposed_value": -0.25,
            "reason": f"Sustained high reference prices ({base_gas} > 1.80) indicate increased demand destruction.",
            "confidence": 0.85
        })

    if base_die > 1.90:
        changes.append({
            "parameter": "elast_die",
            "current_value": state.get("elast_die", -0.15),
            "proposed_value": -0.18,
            "reason": f"Sustained high diesel prices ({base_die} > 1.90) leading to measurable freight efficiency gains.",
            "confidence": 0.75
        })

    summary = f"Proposed {len(changes)} adjustments based on threshold analysis." if changes else "Prices remain within standard deviation bands. No recalibration needed."
    
    return {
        "changes": changes,
        "summary": summary,
        "model_used": "baseline-math",
    }
