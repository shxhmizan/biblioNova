"""Deterministic MCP tool calls for the synchronous upload/parse step.

This is used directly by the sessions router, not by an agent: system flow
step 1 says the backend "immediately calls" the bibtex-parser-server tools,
with no LLM reasoning involved in deciding to do so. Genuine tools/list
discovery still happens, then tools/call for each tool in sequence.
"""

import json
from contextlib import asynccontextmanager

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import CallToolResult

from app.mcp_registry import stdio_params


@asynccontextmanager
async def mcp_session(server_key: str):
    params = StdioServerParameters(**stdio_params(server_key))
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            yield session


async def parse_and_extract(raw_bib: str) -> dict:
    """Call bibtex-parser-server's parse_bibtex then extract_metadata in sequence.

    Returns the merged corpus_stats dict plus the parsed records list.
    """
    async with mcp_session("bibtex_parser") as session:
        discovered = await session.list_tools()
        tool_names = {t.name for t in discovered.tools}
        for required in ("parse_bibtex", "extract_metadata"):
            if required not in tool_names:
                raise RuntimeError(f"bibtex-parser-server did not advertise tool '{required}'")

        parse_result = await session.call_tool("parse_bibtex", {"content": raw_bib})
        parsed = _structured_content(parse_result)

        metadata_result = await session.call_tool(
            "extract_metadata",
            {"records": parsed["records"], "skipped": parsed["skipped"]},
        )
        stats = _structured_content(metadata_result)

    return {"records": parsed["records"], "corpus_stats": stats}


def _structured_content(result: CallToolResult) -> dict:
    if result.isError:
        raise RuntimeError(f"MCP tool call failed: {result.content}")
    if result.structuredContent is not None:
        return result.structuredContent
    return json.loads(result.content[0].text)
