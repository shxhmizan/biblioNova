"""Generic runner for MCP-backed specialist nodes (Bibliometric Analyst, Science Mapping).

Both specialists work the same way: discover the server's tools for real via
tools/list, call every discovered tool with the parsed records, then have an
LLM summarize the combined structured output. Adding a tool to either server
requires no change here — it's just discovered and called like the rest.
"""

import json
import time
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.mcp_client import discover_tools, parse_tool_result
from agents.nodes.common import maybe_skip
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


async def _llm_summarize(goal: str, combined_result: dict, prompt_name: str) -> str:
    prompt = Template(load_prompt(prompt_name)).safe_substitute(
        goal=goal, result_json=json.dumps(combined_result, indent=2)
    )
    response = await build_summary_llm().ainvoke(prompt)
    return response.content


async def summarize_specialist(
    goal: str,
    combined_result: dict,
    prompt_name: str,
    summarize_fn: SummarizeFn | None = None,
) -> str:
    if summarize_fn is not None:
        return await summarize_fn(goal, combined_result)
    return await _llm_summarize(goal, combined_result, prompt_name)


async def run_mcp_specialist(
    state: GraphState,
    *,
    agent_name: str,
    server_key: str,
    summary_prompt_name: str,
    event_sink: EventSink = noop_sink,
    summarize_fn: SummarizeFn | None = None,
) -> GraphState:
    if await maybe_skip(state, agent_name, event_sink):
        return state

    await event_sink("agent_started", agent_name, {})

    tools = await discover_tools(server_key)
    await event_sink("tool_discovered", agent_name, {"tools": [t.name for t in tools]})

    combined_result: dict = {}
    for tool in tools:
        started = time.monotonic()
        raw_result = await tool.ainvoke({"records": state["records"]})
        duration = time.monotonic() - started
        combined_result[tool.name] = parse_tool_result(raw_result)
        await event_sink(
            "tool_called",
            agent_name,
            {"tool": tool.name, "duration_seconds": round(duration, 3)},
        )

    summary = await summarize_specialist(
        state["goal"], combined_result, summary_prompt_name, summarize_fn
    )

    await event_sink("agent_completed", agent_name, {"tools_called": list(combined_result)})

    return {
        **state,
        "results": {**state.get("results", {}), agent_name: combined_result},
        "summaries": {**state.get("summaries", {}), agent_name: summary},
    }
