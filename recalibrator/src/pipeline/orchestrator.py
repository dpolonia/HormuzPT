"""
Recalibration pipeline orchestrator per CLAUDE.md §6.1.

Pipeline steps:
1. DATA_COLLECTOR  → reads GCS snapshots from last 7 days
2. ANALYST         → LLM analyses data, proposes adjustments (JSON)
3. EVIDENCE        → Scopus query formulation, abstract summarization
4. VALIDATOR       → Cross-validation of proposals against evidence
5. RISK_CLASSIFIER → Classify: AUTO_APPLY / ADVISORY / HUMAN_REVIEW
6. WRITER          → Write changelog in PT (APA 7th)
7. APPLIER         → Apply if AUTO/ADVISORY, or mark as pending
8. CHANGELOG       → Write entry to GCS /history/
"""

import logging
from datetime import datetime, timezone

from ..models.proposal import RecalibrationProposal
from ..models.state import ModelState
from .data_collector import collect_data
from .analyst import analyse
from .evidence import gather_evidence
from .validator import validate

logger = logging.getLogger(__name__)


async def run_pipeline(dry_run: bool = False) -> dict:
    """Execute the full recalibration pipeline."""
    started_at = datetime.now(timezone.utc).isoformat()
    logger.info("Starting recalibration pipeline (dry_run=%s)", dry_run)

    # Step 1: Collect data
    data = await collect_data()
    logger.info("Data collection complete: %d snapshots", len(data.get("snapshots", [])))

    # Step 2: Analyse with LLM
    analysis = await analyse(data)
    logger.info("Analysis complete: %d proposed changes", len(analysis.get("changes", [])))

    # Step 3: Gather evidence
    evidence = await gather_evidence(analysis)
    logger.info("Evidence gathered: %d references", len(evidence.get("references", [])))

    # Step 4: Validate
    validation = await validate(analysis, evidence)
    logger.info("Validation complete: risk_class=%s", validation.get("risk_class", "unknown"))

    # Steps 5-8: Classification, writing, applying, changelog
    # TODO: Implement remaining pipeline steps
    result = {
        "status": "completed",
        "dry_run": dry_run,
        "started_at": started_at,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "data_snapshots": len(data.get("snapshots", [])),
        "proposed_changes": len(analysis.get("changes", [])),
        "evidence_refs": len(evidence.get("references", [])),
        "risk_class": validation.get("risk_class", "unknown"),
        "applied": False if dry_run else validation.get("risk_class") in ("AUTO_APPLY", "ADVISORY"),
    }

    logger.info("Pipeline complete: %s", result)
    return result
