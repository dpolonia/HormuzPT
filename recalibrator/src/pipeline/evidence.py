"""Evidence — Scopus query formulation and abstract summarization."""

import logging

logger = logging.getLogger(__name__)

# Pre-defined Scopus queries from CLAUDE.md §4.9
SCOPUS_QUERIES = [
    'TITLE-ABS-KEY("oil price" AND "pass-through" AND inflation) AND PUBYEAR > 2019',
    'TITLE-ABS-KEY("price elasticity" AND (gasoline OR diesel) AND "short run") AND PUBYEAR > 2018',
    'TITLE-ABS-KEY("energy shock" AND GDP AND (Europe OR Portugal)) AND PUBYEAR > 2019',
    'TITLE-ABS-KEY("fiscal policy" AND "energy crisis" AND budget) AND PUBYEAR > 2020',
    'TITLE-ABS-KEY("Strait of Hormuz" AND (disruption OR blockade OR insurance)) AND PUBYEAR > 2015',
    'TITLE-ABS-KEY("energy transition" AND "oil shock" AND accelerat*) AND PUBYEAR > 2020',
]


async def gather_evidence(analysis: dict) -> dict:
    """Gather evidence from Scopus for proposed changes."""
    # TODO: Implement Scopus API calls with X-ELS-APIKey header
    # Base: https://api.elsevier.com/content/search/scopus
    logger.info("Evidence: returning stub evidence")
    return {
        "references": [],
        "queries_used": [],
        "model_used": "stub",
    }
