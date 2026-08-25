from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CorpusStats(BaseModel):
    record_count: int
    valid_count: int
    skipped_count: int
    year_min: int | None
    year_max: int | None
    unique_authors: int
    unique_journals: int
    skipped: list[dict]


class SessionCreateResponse(BaseModel):
    id: str
    name: str
    filename: str
    goal: str
    status: str
    corpus_stats: CorpusStats
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(BaseModel):
    id: str
    name: str
    filename: str
    goal: str
    status: str
    corpus_stats: dict
    acquisition_mode: str
    search_query: str | None
    sources_used: list[str] | None
    results_retrieved: int | None
    results_selected: int | None
    routing_decision: dict | None
    executive_summary: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionListItemResponse(BaseModel):
    id: str
    name: str
    filename: str
    goal: str
    status: str
    routing_decision: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionRenameRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class AgentEventResponse(BaseModel):
    event_type: str
    agent_name: str | None
    payload: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisResultResponse(BaseModel):
    agent_name: str
    result_json: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyzeTriggerResponse(BaseModel):
    id: str
    status: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    question: str
    answer: str


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---- Agentic Search (Data Acquisition) ----


class AcquisitionSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    year_from: int | None = Field(None, ge=1900, le=2100)
    year_to: int | None = Field(None, ge=1900, le=2100)
    max_results: int = Field(100, ge=5, le=500)


class AcquisitionCandidate(BaseModel):
    source: str
    source_id: str
    title: str
    authors: list[str]
    year: int | None
    venue: str
    abstract: str
    doi: str
    times_cited: int
    is_oa: bool
    url: str
    bibtex_key: str
    bibtex_entry: str


class AcquisitionSearchResponse(BaseModel):
    id: str
    status: str  # "awaiting_selection" | "needs_clarification"
    message: str | None
    sources_used: list[str]
    results_retrieved: int
    candidates: list[AcquisitionCandidate]


class SelectedRecord(BaseModel):
    bibtex_entry: str


class AcquisitionConfirmRequest(BaseModel):
    goal: str = Field(..., min_length=20)
    selected: list[SelectedRecord] = Field(..., min_length=1)
