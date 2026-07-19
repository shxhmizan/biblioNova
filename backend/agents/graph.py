"""LangGraph wiring: Coordinator -> Bibliometric Analyst -> Science Mapping ->
Text Mining -> Insights & Reporting -> Research Advisor.

Routing rules (graph topology) are hard-coded edges, per the locked system
flow — the LLM only chooses the specialist subset inside coordinator_node.
Specialists run sequentially in this fixed order regardless of activation;
each one checks the routing decision itself and no-ops (emitting
agent_skipped) if it wasn't activated. No parallel fan-out in this prototype
(future work: parallelize independent specialists once skip/activate
semantics are proven out).

Insights & Reporting and Research Advisor are NOT selectively activated —
they always run once the coordinator didn't ask for clarification, since by
construction that means at least one specialist ran (activated=[] is itself
treated as needing clarification in coordinator_node).
"""

from functools import partial

from langgraph.graph import END, START, StateGraph

from agents.events import EventSink, noop_sink
from agents.nodes.bibliometric_analyst import bibliometric_analyst_node
from agents.nodes.coordinator import DecisionFn, coordinator_node
from agents.nodes.insights_reporting import GapAnalysisFn, insights_reporting_node
from agents.nodes.mcp_specialist import SummarizeFn as McpSummarizeFn
from agents.nodes.research_advisor import RecommendFn, research_advisor_node
from agents.nodes.science_mapping import science_mapping_node
from agents.nodes.text_mining import EmbedFn, text_mining_node
from agents.nodes.text_mining import SummarizeFn as TextMiningSummarizeFn
from agents.state import GraphState

AVAILABLE_SPECIALISTS = ["bibliometric_analyst", "science_mapping", "text_mining"]


def _route_after_coordinator(state: GraphState) -> str:
    return "end" if state.get("needs_clarification") else "run_specialists"


def build_graph(
    event_sink: EventSink = noop_sink,
    decision_fn: DecisionFn | None = None,
    bibliometric_summarize_fn: McpSummarizeFn | None = None,
    science_mapping_summarize_fn: McpSummarizeFn | None = None,
    text_mining_embed_fn: EmbedFn | None = None,
    text_mining_summarize_fn: TextMiningSummarizeFn | None = None,
    gap_analysis_fn: GapAnalysisFn | None = None,
    recommend_fn: RecommendFn | None = None,
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
        partial(
            bibliometric_analyst_node, event_sink=event_sink, summarize_fn=bibliometric_summarize_fn
        ),
    )
    graph.add_node(
        "science_mapping",
        partial(
            science_mapping_node, event_sink=event_sink, summarize_fn=science_mapping_summarize_fn
        ),
    )
    graph.add_node(
        "text_mining",
        partial(
            text_mining_node,
            event_sink=event_sink,
            embed_fn=text_mining_embed_fn,
            summarize_fn=text_mining_summarize_fn,
        ),
    )
    graph.add_node(
        "insights_reporting",
        partial(insights_reporting_node, event_sink=event_sink, gap_analysis_fn=gap_analysis_fn),
    )
    graph.add_node(
        "research_advisor",
        partial(research_advisor_node, event_sink=event_sink, recommend_fn=recommend_fn),
    )

    graph.add_edge(START, "coordinator")
    graph.add_conditional_edges(
        "coordinator",
        _route_after_coordinator,
        {"run_specialists": "bibliometric_analyst", "end": END},
    )
    graph.add_edge("bibliometric_analyst", "science_mapping")
    graph.add_edge("science_mapping", "text_mining")
    graph.add_edge("text_mining", "insights_reporting")
    graph.add_edge("insights_reporting", "research_advisor")
    graph.add_edge("research_advisor", END)

    return graph.compile()
