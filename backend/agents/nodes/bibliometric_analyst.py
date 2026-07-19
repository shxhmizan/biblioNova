"""Bibliometric Analyst node: publication trends, citation analysis, author/journal
rankings — via genuine MCP discovery + invocation against bibliometric-analysis-server.
"""

from functools import partial

from agents.nodes.mcp_specialist import SummarizeFn, run_mcp_specialist

bibliometric_analyst_node = partial(
    run_mcp_specialist,
    agent_name="bibliometric_analyst",
    server_key="bibliometric_analysis",
    summary_prompt_name="bibliometric_analyst_summary.v1.md",
)

__all__ = ["bibliometric_analyst_node", "SummarizeFn"]
