"""Data collector — reads GCS snapshots or local baseline state."""

import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# Path relative to the recalibrator service root (which is in /recalibrator)
DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "model_state_initial.json"

async def collect_data() -> dict:
    """Collect data snapshots from baseline state or cache."""
    logger.info("Data collector: reading baseline state from %s", DATA_PATH)
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            state = json.load(f)
            
        return {
            "snapshots": [state],
            "period_start": state.get("updated_at"),
            "period_end": state.get("updated_at"),
        }
    except Exception as e:
        logger.error("Failed to read baseline state: %s", e)
        return {
            "snapshots": [],
            "period_start": None,
            "period_end": None,
            "error": str(e)
        }
