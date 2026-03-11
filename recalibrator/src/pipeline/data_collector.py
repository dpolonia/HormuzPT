"""Data collector — reads GCS snapshots from last 7 days."""

import logging

logger = logging.getLogger(__name__)


async def collect_data() -> dict:
    """Collect data snapshots from GCS cache."""
    # TODO: Implement GCS read from gs://{bucket}/snapshots/
    logger.info("Data collector: returning stub data")
    return {
        "snapshots": [],
        "period_start": None,
        "period_end": None,
    }
