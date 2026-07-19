from sqlalchemy.orm import Session as DBSession

from agents.events import EventSink
from app.models import AgentEvent


def make_db_event_sink(db: DBSession, session_id: str) -> EventSink:
    async def sink(event_type: str, agent_name: str | None, payload: dict) -> None:
        db.add(
            AgentEvent(
                session_id=session_id,
                event_type=event_type,
                agent_name=agent_name,
                payload=payload,
            )
        )
        db.commit()

    return sink
