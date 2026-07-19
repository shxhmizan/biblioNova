"""Insights & Reporting node: synthesizes specialist outputs into gap analysis.

Always runs once at least one specialist ran — enforced by the graph topology
(see agents/graph.py), not by a per-node activation check like the specialists
have. The PDF report itself is assembled once Research Advisor's
recommendations are also available (see agents/nodes/research_advisor.py) so
the downloadable report is complete rather than missing its final section;
report_pdf.py is still the module that owns the reporting/layout logic.
"""

import json
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.prompts_loader import load_prompt
from agents.schemas import GapAnalysis
from agents.state import GraphState
from app.config import settings

GapAnalysisFn = Callable[[str, dict, list[str]], Awaitable[GapAnalysis]]


def build_gap_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0.2,
    )


async def _llm_identify_gaps(
    goal: str, specialist_results: dict, record_ids: list[str]
) -> GapAnalysis:
    prompt = Template(load_prompt("insights_reporting_gaps.v1.md")).safe_substitute(
        goal=goal,
        specialist_results_json=json.dumps(specialist_results, indent=2),
        record_ids_csv=", ".join(record_ids),
    )
    llm = build_gap_llm().with_structured_output(GapAnalysis)
    return await llm.ainvoke(prompt)


async def identify_gaps(
    goal: str,
    specialist_results: dict,
    record_ids: list[str],
    gap_analysis_fn: GapAnalysisFn | None = None,
) -> GapAnalysis:
    fn = gap_analysis_fn or _llm_identify_gaps
    return await fn(goal, specialist_results, record_ids)


def _finalize_gaps(gap_analysis: GapAnalysis, known_ids: set[str]) -> GapAnalysis:
    """Assign stable gap IDs and drop any hallucinated (non-existent) record IDs."""
    for i, gap in enumerate(gap_analysis.gaps, start=1):
        gap.id = f"gap-{i}"
        gap.supporting_record_ids = [rid for rid in gap.supporting_record_ids if rid in known_ids]
    return gap_analysis


async def insights_reporting_node(
    state: GraphState,
    event_sink: EventSink = noop_sink,
    gap_analysis_fn: GapAnalysisFn | None = None,
) -> GraphState:
    await event_sink("agent_started", "insights_reporting", {})

    specialist_names = ("bibliometric_analyst", "science_mapping", "text_mining")
    results = state.get("results", {})
    summaries = state.get("summaries", {})
    specialist_results = {
        name: {"result": results[name], "summary": summaries.get(name)}
        for name in specialist_names
        if name in results
    }
    known_ids = {r["id"] for r in state["records"]}

    gap_analysis = await identify_gaps(
        state["goal"], specialist_results, sorted(known_ids), gap_analysis_fn
    )
    gap_analysis = _finalize_gaps(gap_analysis, known_ids)

    updated_summaries = {**summaries, "insights_reporting": gap_analysis.executive_summary}

    await event_sink("agent_completed", "insights_reporting", {"gap_count": len(gap_analysis.gaps)})

    return {
        **state,
        "results": {**results, "insights_reporting": gap_analysis.model_dump()},
        "summaries": updated_summaries,
    }
