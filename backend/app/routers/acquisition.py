"""Agentic Search: search for papers instead of uploading a .bib file.

POST /sessions/search creates the session immediately (so Data Acquisition's
events persist against a real session_id, the same way the specialist
pipeline's events do) and runs the search synchronously. POST
/sessions/{id}/confirm-search takes the user's selection, converts it to
raw_bib text, and runs it through the exact same bibtex-parser-server parse
step the upload path uses -- everything downstream (analyze, results, etc.)
is identical from there, with zero special-casing.
"""

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db import get_db
from app.models import AnalysisSession
from app.schemas import (
    AcquisitionConfirmRequest,
    AcquisitionSearchRequest,
    AcquisitionSearchResponse,
    SessionCreateResponse,
)
from app.services.data_acquisition import run_search
from app.services.events import make_db_event_sink
from app.services.mcp_tools import parse_and_extract

router = APIRouter(prefix="/sessions", tags=["acquisition"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "search"


@router.post("/search", response_model=AcquisitionSearchResponse, status_code=201)
async def search_papers(
    body: AcquisitionSearchRequest, db: DBSession = Depends(get_db)
) -> AcquisitionSearchResponse:
    session = AnalysisSession(
        name=body.query[:255],
        filename=f"{_slugify(body.query)}.bib",
        goal="",
        status="searching",
        raw_bib="",
        corpus_stats={},
        parsed_records=[],
        acquisition_mode="agentic_search",
        search_query=body.query,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    event_sink = make_db_event_sink(db, session.id)

    try:
        result = await run_search(
            body.query, body.year_from, body.year_to, body.max_results, event_sink
        )
    except Exception as exc:  # noqa: BLE001 - surface as a failed session, not a bare 500
        session.status = "failed"
        session.error_message = str(exc)
        db.commit()
        raise HTTPException(status_code=502, detail="Data Acquisition failed") from exc

    session.sources_used = result["sources_used"]
    session.results_retrieved = result["results_retrieved"]
    session.status = (
        "needs_clarification" if result["clarification_message"] else "awaiting_selection"
    )
    session.error_message = result["clarification_message"]
    db.commit()

    return AcquisitionSearchResponse(
        id=session.id,
        status=session.status,
        message=result["clarification_message"],
        sources_used=result["sources_used"],
        results_retrieved=result["results_retrieved"],
        candidates=result["candidates"],
    )


@router.post("/{session_id}/confirm-search", response_model=SessionCreateResponse)
async def confirm_search(
    session_id: str, body: AcquisitionConfirmRequest, db: DBSession = Depends(get_db)
) -> AnalysisSession:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.acquisition_mode != "agentic_search":
        raise HTTPException(status_code=400, detail="Session was not created via Agentic Search")
    if session.status != "awaiting_selection":
        raise HTTPException(
            status_code=409, detail=f"Session is not awaiting selection (status={session.status})"
        )

    raw_bib = "\n\n".join(r.bibtex_entry for r in body.selected)
    parsed = await parse_and_extract(raw_bib)

    session.goal = body.goal
    session.raw_bib = raw_bib
    session.corpus_stats = parsed["corpus_stats"]
    session.parsed_records = parsed["records"]
    session.results_selected = len(body.selected)
    session.status = "uploaded"
    db.commit()
    db.refresh(session)
    return session
