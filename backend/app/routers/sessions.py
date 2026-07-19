from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session as DBSession

from app.db import get_db
from app.models import AgentEvent, AnalysisResult, AnalysisSession, Report
from app.schemas import (
    AgentEventResponse,
    AnalysisResultResponse,
    SessionCreateResponse,
    SessionDetailResponse,
)
from app.services.mcp_tools import parse_and_extract

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionCreateResponse, status_code=201)
async def create_session(
    file: UploadFile,
    goal: str = Form(..., min_length=20),
    db: DBSession = Depends(get_db),
) -> AnalysisSession:
    if not file.filename or not file.filename.lower().endswith(".bib"):
        raise HTTPException(status_code=400, detail="Only .bib files are accepted")

    raw_bytes = await file.read()
    try:
        raw_bib = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 text") from exc

    parsed = await parse_and_extract(raw_bib)

    session = AnalysisSession(
        filename=file.filename,
        goal=goal,
        status="uploaded",
        raw_bib=raw_bib,
        corpus_stats=parsed["corpus_stats"],
        parsed_records=parsed["records"],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str, db: DBSession = Depends(get_db)) -> AnalysisSession:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/events", response_model=list[AgentEventResponse])
def get_session_events(session_id: str, db: DBSession = Depends(get_db)) -> list[AgentEvent]:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return (
        db.query(AgentEvent)
        .filter(AgentEvent.session_id == session_id)
        .order_by(AgentEvent.created_at)
        .all()
    )


@router.get("/{session_id}/results", response_model=list[AnalysisResultResponse])
def get_session_results(session_id: str, db: DBSession = Depends(get_db)) -> list[AnalysisResult]:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).all()


@router.get("/{session_id}/report")
def get_session_report(session_id: str, db: DBSession = Depends(get_db)) -> Response:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    report = db.query(Report).filter(Report.session_id == session_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not generated for this session yet")
    return Response(
        content=report.pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{session_id}-report.pdf"'},
    )
