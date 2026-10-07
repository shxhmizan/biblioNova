"""Shared helpers for specialist nodes: the selective-activation skip check,
and condensing large tool-output graphs before they enter an LLM prompt.
"""

from agents.events import EventSink
from agents.state import GraphState


def condense_for_prompt(value):
    """Replace full node/edge graph payloads with counts before handing tool
    output to an LLM prompt. Graphs like the co-authorship or co-occurrence
    network scale with corpus size (1,000+ authors -> tens of thousands of
    edges) and can blow past smaller models' input limits; a summary/gap
    prompt only needs the aggregate numbers, while the full graph stays in
    state["results"] for the frontend to render.
    """
    if isinstance(value, dict):
        if isinstance(value.get("nodes"), list) and isinstance(value.get("edges"), list):
            condensed = {k: v for k, v in value.items() if k not in ("nodes", "edges")}
            condensed["node_count"] = len(value["nodes"])
            condensed["edge_count"] = len(value["edges"])
            return condensed
        return {k: condense_for_prompt(v) for k, v in value.items()}
    if isinstance(value, list):
        return [condense_for_prompt(v) for v in value]
    return value


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
