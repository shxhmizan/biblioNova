"""Genuine MCP tool discovery for LangGraph specialist agents.

Wraps langchain-mcp-adapters so specialist nodes get real tools/list
discovery and langchain Tool objects bound to real tools/call execution.
Adding a tool to a server's tools/list requires zero changes here or in the
calling node — the tool simply becomes discoverable.
"""

import json

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.mcp_registry import stdio_params


async def discover_tools(server_key: str) -> list[BaseTool]:
    """Spawn the given MCP server over stdio and return its discovered tools."""
    client = MultiServerMCPClient({server_key: {"transport": "stdio", **stdio_params(server_key)}})
    return await client.get_tools(server_name=server_key)


def parse_tool_result(raw: list[dict] | str) -> dict:
    """Parse a langchain-mcp-adapters tool result (raw MCP content blocks) into JSON."""
    if isinstance(raw, str):
        return json.loads(raw)
    text_block = next(block["text"] for block in raw if block.get("type") == "text")
    return json.loads(text_block)
