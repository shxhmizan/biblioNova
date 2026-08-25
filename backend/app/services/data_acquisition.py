"""Data Acquisition: search_openalex + search_arxiv (concurrently), merge, and
convert to BibTeX via to_bibtex -- all through genuine MCP tools/list discovery
+ tools/call, exactly like the specialist agents.

Runs before any research goal is known (Agentic Search mode only), so it
lives outside the LangGraph pipeline (which is rooted at the goal-driven
Coordinator) -- structurally parallel to how the synchronous upload/parse
step (app/services/mcp_tools.py) also runs outside the graph.
"""

import asyncio
import json
import time
from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import CallToolResult

from agents.events import EventSink, noop_sink
from app.mcp_registry import stdio_params

MIN_RESULTS = 5

SessionFactory = Callable[[], AbstractAsyncContextManager[ClientSession]]


@asynccontextmanager
async def _default_session() -> AsyncIterator[ClientSession]:
    params = StdioServerParameters(**stdio_params("data_acquisition"))
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            yield session


def _structured_content(result: CallToolResult) -> dict | list:
    if result.isError:
        raise RuntimeError(f"MCP tool call failed: {result.content}")
    if result.structuredContent is not None:
        return result.structuredContent
    return json.loads(result.content[0].text)


async def run_search(
    query: str,
    year_from: int | None,
    year_to: int | None,
    max_results: int,
    event_sink: EventSink = noop_sink,
    session_factory: SessionFactory | None = None,
) -> dict:
    """Returns {sources_used, results_retrieved, candidates, clarification_message}.

    clarification_message is non-None (and candidates may be empty or below
    MIN_RESULTS) when the query was too narrow to proceed -- the caller must
    not create an analyzable corpus from that result.

    session_factory exists purely for testing: it lets tests connect to a
    real in-process data-acquisition-server (real tools/list, real to_bibtex
    dedupe/generation) over in-memory streams instead of spawning a real
    subprocess, with only the network-calling leaf functions faked -- the
    same "fake the external boundary, keep everything else real" seam this
    codebase already uses for LLM calls (decision_fn, summarize_fn, etc.).
    """
    await event_sink("agent_started", "data_acquisition", {"query": query})

    factory = session_factory or _default_session
    async with factory() as session:
        discovered = await session.list_tools()
        tool_names = {t.name for t in discovered.tools}
        await event_sink("tool_discovered", "data_acquisition", {"tools": sorted(tool_names)})

        for required in ("search_openalex", "search_arxiv", "to_bibtex"):
            if required not in tool_names:
                raise RuntimeError(f"data-acquisition-server did not advertise tool '{required}'")

        async def _call_source(tool_name: str, source_label: str, args: dict) -> list[dict]:
            started = time.monotonic()
            try:
                result = await session.call_tool(tool_name, args)
                raw = _structured_content(result)
                # FastMCP wraps a bare list[dict] return as {"result": [...]}
                # (structured tool output must be a JSON object per the MCP
                # spec) -- to_bibtex returns a dict directly and needs no
                # unwrapping, but search_openalex/search_arxiv do.
                records = raw.get("result", []) if isinstance(raw, dict) else raw
            except Exception:  # noqa: BLE001 - one flaky source must not sink the search
                records = []
            duration = time.monotonic() - started
            await event_sink(
                "tool_called",
                "data_acquisition",
                {
                    "tool": tool_name,
                    "source": source_label,
                    "query": query,
                    "duration_seconds": round(duration, 3),
                    "result_count": len(records) if isinstance(records, list) else 0,
                },
            )
            return records if isinstance(records, list) else []

        openalex_records, arxiv_records = await asyncio.gather(
            _call_source(
                "search_openalex",
                "openalex",
                {
                    "query": query,
                    "max_results": max_results,
                    "year_from": year_from,
                    "year_to": year_to,
                },
            ),
            _call_source("search_arxiv", "arxiv", {"query": query, "max_results": max_results}),
        )

        sources_used = []
        if openalex_records:
            sources_used.append("openalex")
        if arxiv_records:
            sources_used.append("arxiv")

        merged = openalex_records + arxiv_records

        started = time.monotonic()
        bibtex_result = await session.call_tool("to_bibtex", {"records": merged})
        bibtex_data = _structured_content(bibtex_result)
        duration = time.monotonic() - started
        await event_sink(
            "tool_called",
            "data_acquisition",
            {
                "tool": "to_bibtex",
                "duration_seconds": round(duration, 3),
                "duplicates_removed": bibtex_data.get("duplicates_removed", 0),
            },
        )

    candidates = bibtex_data.get("records", [])
    results_retrieved = len(candidates)

    if results_retrieved < MIN_RESULTS:
        await event_sink(
            "agent_completed",
            "data_acquisition",
            {"outcome": "clarification_needed", "results_retrieved": results_retrieved},
        )
        return {
            "sources_used": sources_used,
            "results_retrieved": results_retrieved,
            "candidates": candidates,
            "clarification_message": (
                f"Only found {results_retrieved} matching paper(s) across "
                f"{', '.join(sources_used) or 'no sources'}. Try a broader or "
                "differently-worded research area."
            ),
        }

    await event_sink(
        "agent_completed",
        "data_acquisition",
        {"results_retrieved": results_retrieved, "sources_used": sources_used},
    )
    return {
        "sources_used": sources_used,
        "results_retrieved": results_retrieved,
        "candidates": candidates,
        "clarification_message": None,
    }
