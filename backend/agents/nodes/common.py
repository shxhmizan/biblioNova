"""Shared helpers for specialist nodes: the selective-activation skip check."""

from agents.events import EventSink
from agents.state import GraphState


def is_activated(state: GraphState, agent_name: str) -> bool:
    return agent_name in state["routing_decision"]["activated"]


def _skip_reason(state: GraphState, agent_name: str) -> str:
    for skip in state["routing_decision"]["skipped"]:
        if skip["agent"] == agent_name:
            return skip["reason"]
    return "Not required for this goal."


async def maybe_skip(state: GraphState, agent_name: str, event_sink: EventSink) -> bool:
    """Emit agent_skipped and return True if this specialist was not activated."""
    if is_activated(state, agent_name):
        return False
    await event_sink("agent_skipped", agent_name, {"reason": _skip_reason(state, agent_name)})
    return True
