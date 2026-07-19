from typing import Any, TypedDict


class GraphState(TypedDict, total=False):
    session_id: str
    goal: str
    corpus_stats: dict[str, Any]
    records: list[dict[str, Any]]

    routing_decision: dict[str, Any]
    needs_clarification: bool

    results: dict[str, Any]  # agent_name -> result JSON
    summaries: dict[str, str]  # agent_name -> natural-language summary

    report_pdf: bytes
    report_page_count: int

    error: str | None
