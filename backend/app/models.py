import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class AnalysisSession(Base):
    """A single upload + goal + analysis run. Maps to the thesis concept of a 'session'."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(255))
    goal: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    # uploaded -> needs_clarification | running -> completed | failed

    raw_bib: Mapped[str] = mapped_column(Text)
    corpus_stats: Mapped[dict] = mapped_column(JSON, default=dict)
    parsed_records: Mapped[list] = mapped_column(JSON, default=list)

    routing_decision: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    executive_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    events: Mapped[list["AgentEvent"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    results: Mapped[list["AnalysisResult"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    report: Mapped["Report | None"] = relationship(
        back_populates="session", cascade="all, delete-orphan", uselist=False
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class AgentEvent(Base):
    """Structured progress event, persisted for the live progress screen and thesis evaluation."""

    __tablename__ = "agent_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    event_type: Mapped[str] = mapped_column(String(32))
    # agent_started | agent_skipped | tool_discovered | tool_called | agent_completed
    agent_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[AnalysisSession] = relationship(back_populates="events")


class AnalysisResult(Base):
    """Structured JSON output produced by one agent for one session."""

    __tablename__ = "analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    agent_name: Mapped[str] = mapped_column(String(64))
    result_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[AnalysisSession] = relationship(back_populates="results")


class Report(Base):
    """Generated PDF report for a session — one per session."""

    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), unique=True)
    pdf_bytes: Mapped[bytes] = mapped_column(LargeBinary)
    page_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[AnalysisSession] = relationship(back_populates="report")


class ChatMessage(Base):
    """One turn of the read-only, analysis-grounded chat for a session."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(16))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[AnalysisSession] = relationship(back_populates="chat_messages")
