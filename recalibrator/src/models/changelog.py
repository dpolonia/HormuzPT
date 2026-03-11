"""Pydantic models for changelog entries."""

from pydantic import BaseModel


class ChangelogEntry(BaseModel):
    """A single changelog entry for the history page."""

    version: str
    created_at: str
    author_model: str  # LLM that wrote the changelog
    risk_class: str
    summary_pt: str  # Portuguese summary for public display
    parameters_changed: list[str]
    evidence_count: int
    applied: bool
    dry_run: bool = False
