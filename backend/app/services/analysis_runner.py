"""Runs the LangGraph analysis graph for a session as a FastAPI background task."""

from agents.graph import build_graph
from app.db import SessionLocal
from app.models import AnalysisResult, AnalysisSession, Report
from app.services.events import make_db_event_sink


async def run_analysis(session_id: str) -> None:
    db = SessionLocal()
    try:
        session = db.get(AnalysisSession, session_id)
        if session is None:
            return

        session.status = "running"
        db.commit()

        event_sink = make_db_event_sink(db, session_id)
        graph = build_graph(event_sink=event_sink)

        try:
            final_state = await graph.ainvoke(
                {
                    "session_id": session_id,
                    "goal": session.goal,
                    "corpus_stats": session.corpus_stats,
                    "records": session.parsed_records,
                    "results": {},
                    "summaries": {},
                }
            )
        except Exception as exc:  # noqa: BLE001 - any node failure must surface, not crash the worker
            session.status = "failed"
            session.error_message = str(exc)
            db.commit()
            return

        session.routing_decision = final_state.get("routing_decision")

        if final_state.get("needs_clarification"):
            session.status = "needs_clarification"
            db.commit()
            return

        for agent_name, result in final_state.get("results", {}).items():
            db.add(AnalysisResult(session_id=session_id, agent_name=agent_name, result_json=result))

        summaries = final_state.get("summaries", {})
        session.executive_summary = summaries.get("insights_reporting") or " ".join(
            summaries.values()
        )

        if final_state.get("report_pdf") is not None:
            db.add(
                Report(
                    session_id=session_id,
                    pdf_bytes=final_state["report_pdf"],
                    page_count=final_state["report_page_count"],
                )
            )

        session.status = "completed"
        db.commit()
    finally:
        db.close()
