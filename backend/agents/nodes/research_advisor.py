"""Research Advisor node: one recommendation per gap, strictly 1:1, never runs
independently of Insights & Reporting (enforced by graph topology). Also
assembles the final PDF report once recommendations exist, so the downloadable
report is complete (see agents/nodes/insights_reporting.py for why).
"""

import json
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.llm_retry import invoke_with_retry
from agents.nodes.report_pdf import generate_report_pdf
from agents.prompts_loader import load_prompt
from agents.schemas import RecommendationSet
from agents.state import GraphState
from app.config import settings

RecommendFn = Callable[[str, list[dict]], Awaitable[RecommendationSet]]


def build_advisor_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0.3,
        max_tokens=4096,
    )


async def _llm_recommend(goal: str, gaps: list[dict]) -> RecommendationSet:
    prompt = Template(load_prompt("research_advisor.v1.md")).safe_substitute(
        goal=goal, gaps_json=json.dumps(gaps, indent=2)
    )
    llm = build_advisor_llm().with_structured_output(RecommendationSet, method="json_schema")
    return await invoke_with_retry(lambda: llm.ainvoke(prompt))


async def recommend(
    goal: str, gaps: list[dict], recommend_fn: RecommendFn | None = None
) -> RecommendationSet:
    fn = recommend_fn or _llm_recommend
    return await fn(goal, gaps)


async def research_advisor_node(
    state: GraphState,
    event_sink: EventSink = noop_sink,
    recommend_fn: RecommendFn | None = None,
) -> GraphState:
    await event_sink("agent_started", "research_advisor", {})

    gaps = state["results"]["insights_reporting"]["gaps"]
    recommendation_set = await recommend(state["goal"], gaps, recommend_fn)

    if len(recommendation_set.recommendations) != len(gaps):
        raise RuntimeError(
            f"Research Advisor produced {len(recommendation_set.recommendations)} "
            f"recommendations for {len(gaps)} gaps — must be exactly 1:1."
        )
    for gap, rec in zip(gaps, recommendation_set.recommendations, strict=True):
        rec.addresses_gap_id = gap["id"]

    recommendations = [r.model_dump() for r in recommendation_set.recommendations]

    # PDF generation is best-effort: a failure here (malformed text, a
    # reportlab/weasyprint quirk) must not discard the specialist results,
    # gaps, and recommendations that are already fully computed at this
    # point. The failure is surfaced via `error` instead of raised.
    report_pdf: bytes | None = None
    report_page_count: int | None = None
    report_error: str | None = None
    try:
        report_pdf, report_page_count = generate_report_pdf(
            goal=state["goal"],
            corpus_stats=state["corpus_stats"],
            summaries=state.get("summaries", {}),
            results=state.get("results", {}),
            gap_analysis=state["results"]["insights_reporting"],
            recommendations=recommendations,
        )
    except Exception as exc:  # noqa: BLE001 - report failure must not discard the analysis
        report_error = f"Report PDF generation failed: {exc}"

    await event_sink(
        "agent_completed",
        "research_advisor",
        {
            "recommendation_count": len(gaps),
            "report_generated": report_pdf is not None,
            **({"report_error": report_error} if report_error else {}),
        },
    )

    return {
        **state,
        "results": {
            **state.get("results", {}),
            "research_advisor": {"recommendations": recommendations},
        },
        "report_pdf": report_pdf,
        "report_page_count": report_page_count,
        "error": report_error,
    }
