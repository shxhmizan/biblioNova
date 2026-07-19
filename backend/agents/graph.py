"""LangGraph wiring: Coordinator -> Bibliometric Analyst (Phase 1 scope).

Routing rules (which node runs after the Coordinator) are hard-coded edges,
per the locked system flow — the LLM only chooses the specialist subset
inside coordinator_node, never the graph topology itself.
"""

from functools import partial

from langgraph.graph import END, START, StateGraph

from agents.events import EventSink, noop_sink
from agents.nodes.bibliometric_analyst import SummarizeFn, bibliometric_analyst_node
from agents.nodes.coordinator import DecisionFn, coordinator_node
from agents.state import GraphState

# Phase 2 adds "science_mapping" and "text_mining" here.
AVAILABLE_SPECIALISTS = ["bibliometric_analyst"]


def _route_after_coordinator(state: GraphState) -> str:
    if state.get("needs_clarification"):
        return "end"
    if "bibliometric_analyst" in state["routing_decision"]["activated"]:
        return "run_bibliometric_analyst"
    return "end"


def build_graph(
    event_sink: EventSink = noop_sink,
    decision_fn: DecisionFn | None = None,
    summarize_fn: SummarizeFn | None = None,
):
    graph = StateGraph(GraphState)

    graph.add_node(
        "coordinator",
        partial(
            coordinator_node,
            available_specialists=AVAILABLE_SPECIALISTS,
            event_sink=event_sink,
            decision_fn=decision_fn,
        ),
    )
    graph.add_node(
        "bibliometric_analyst",
        partial(bibliometric_analyst_node, event_sink=event_sink, summarize_fn=summarize_fn),
    )

    graph.add_edge(START, "coordinator")
    graph.add_conditional_edges(
        "coordinator",
        _route_after_coordinator,
        {"run_bibliometric_analyst": "bibliometric_analyst", "end": END},
    )
    graph.add_edge("bibliometric_analyst", END)

    return graph.compile()
