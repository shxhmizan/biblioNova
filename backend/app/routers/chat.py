from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db import get_db
from app.models import AnalysisResult, AnalysisSession, ChatMessage
from app.schemas import ChatMessageResponse, ChatRequest, ChatResponse
from app.services.chat import answer_question

router = APIRouter(prefix="/sessions", tags=["chat"])


@router.post("/{session_id}/chat", response_model=ChatResponse)
async def post_chat_message(
    session_id: str, body: ChatRequest, db: DBSession = Depends(get_db)
) -> dict:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "completed":
        raise HTTPException(
            status_code=409, detail="Chat is only available once analysis has completed"
        )

    results = db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).all()
    answer = await answer_question(session, results, body.question)

    db.add(ChatMessage(session_id=session_id, role="user", content=body.question))
    db.add(ChatMessage(session_id=session_id, role="assistant", content=answer))
    db.commit()

    return {"question": body.question, "answer": answer}


@router.get("/{session_id}/chat", response_model=list[ChatMessageResponse])
def get_chat_history(session_id: str, db: DBSession = Depends(get_db)) -> list[ChatMessage]:
    session = db.get(AnalysisSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
