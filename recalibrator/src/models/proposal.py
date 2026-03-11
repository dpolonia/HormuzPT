"""Pydantic models for recalibration proposals."""

from pydantic import BaseModel


class ParameterChange(BaseModel):
    """A single parameter adjustment proposal."""

    parameter: str
    old_value: float
    new_value: float
    change_pct: float
    justification: str
    evidence_dois: list[str] = []


class RecalibrationProposal(BaseModel):
    """Full recalibration proposal from the pipeline."""

    version: str
    created_at: str
    analyst_model: str
    validator_model: str
    risk_class: str  # AUTO_APPLY | ADVISORY | HUMAN_REVIEW
    changes: list[ParameterChange]
    summary: str
    confidence_score: float  # 0-1
