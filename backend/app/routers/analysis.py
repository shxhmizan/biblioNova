from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db import get_db
from app.models import AnalysisSession
from app.schemas import AnalyzeTriggerResponse
from app.services.analysis_runner import run_analysis

router = APIRouter(prefix="/sessions", tags=["analysis"])


@router.post("/{session_id}/analyze", response_model=AnalyzeTriggerResponse)
def trigger_analysis(
    session_id: str,
    background_tasks: BackgroundTasks,
    db: DBSession = Depends(get_db),
) -> dict:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "running":
        raise HTTPException(status_code=409, detail="Analysis already running for this session")

    session.status = "running"
    db.commit()

    background_tasks.add_task(run_analysis, session_id)
    return {"id": session_id, "status": "running"}
