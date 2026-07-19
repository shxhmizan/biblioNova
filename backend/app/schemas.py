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
