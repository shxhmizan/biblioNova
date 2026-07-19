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
