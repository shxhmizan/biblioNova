"""Bibliometric Analyst node: discovers bibliometric-analysis-server's tools over
MCP and calls publication_trend genuinely (tools/list then tools/call — no
hardcoded import of the analysis function).

Phase 1 has exactly one discoverable tool, so there is nothing for an LLM to
choose between yet; tool *selection* becomes LLM-driven once citation_analysis
is added in Phase 2. The LLM is still used here, to turn the tool's structured
result into a natural-language summary — that step is the `summarize_fn` seam,
injectable for deterministic tests.
"""

import json
import time
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.mcp_client import discover_tools, parse_tool_result
from agents.prompts_loader import load_prompt
from agents.state import GraphState
from app.config import settings

SummarizeFn = Callable[[str, dict], Awaitable[str]]


def build_summary_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0.2,
    )


async def _llm_summarize_trend(goal: str, trend_result: dict) -> str:
    prompt = Template(load_prompt("bibliometric_analyst_summary.v1.md")).safe_substitute(
        goal=goal, trend_result_json=json.dumps(trend_result, indent=2)
    )
    response = await build_summary_llm().ainvoke(prompt)
    return response.content


async def summarize_trend(
    goal: str, trend_result: dict, summarize_fn: SummarizeFn | None = None
) -> str:
    fn = summarize_fn or _llm_summarize_trend
    return await fn(goal, trend_result)


async def bibliometric_analyst_node(
    state: GraphState,
    event_sink: EventSink = noop_sink,
    summarize_fn: SummarizeFn | None = None,
) -> GraphState:
    await event_sink("agent_started", "bibliometric_analyst", {})

    tools = await discover_tools("bibliometric_analysis")
    await event_sink("tool_discovered", "bibliometric_analyst", {"tools": [t.name for t in tools]})

    tool = next((t for t in tools if t.name == "publication_trend"), None)
    if tool is None:
        raise RuntimeError("bibliometric-analysis-server did not advertise 'publication_trend'")

    started = time.monotonic()
    raw_result = await tool.ainvoke({"records": state["records"]})
    duration = time.monotonic() - started
    trend_result = parse_tool_result(raw_result)

    await event_sink(
        "tool_called",
        "bibliometric_analyst",
        {"tool": "publication_trend", "duration_seconds": round(duration, 3)},
    )

    summary = await summarize_trend(state["goal"], trend_result, summarize_fn)

    await event_sink(
        "agent_completed",
        "bibliometric_analyst",
        {"total_publications": trend_result.get("total_publications")},
    )

    return {
        **state,
        "results": {**state.get("results", {}), "bibliometric_analyst": trend_result},
        "summaries": {**state.get("summaries", {}), "bibliometric_analyst": summary},
    }
