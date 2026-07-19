from typing import Literal

from pydantic import BaseModel, Field


class SpecialistSkip(BaseModel):
    agent: str
    reason: str


class RoutingDecision(BaseModel):
    """Coordinator's structured routing output — persisted as thesis evaluation data."""

    activated: list[str] = Field(default_factory=list)
    skipped: list[SpecialistSkip] = Field(default_factory=list)
    justification: str
    clarification_needed: bool = False
    clarification_message: str | None = None


class Gap(BaseModel):
    """One research gap, as identified by Insights & Reporting. `id` is assigned in
    code (not by the LLM) so Research Advisor can map recommendations to it 1:1."""

    id: str = ""
    title: str
    evidence: str
    confidence: Literal["high", "medium"]
    supporting_record_ids: list[str] = Field(default_factory=list)


class GapAnalysis(BaseModel):
    gaps: list[Gap] = Field(default_factory=list)
    executive_summary: str


class Recommendation(BaseModel):
    """One future-research recommendation. `addresses_gap_id` is assigned in code
    by position, guaranteeing the locked 1:1 gap<->recommendation mapping."""

    addresses_gap_id: str = ""
    topic: str
    rationale: str
    suggested_methodology: str


class RecommendationSet(BaseModel):
    recommendations: list[Recommendation] = Field(default_factory=list)
