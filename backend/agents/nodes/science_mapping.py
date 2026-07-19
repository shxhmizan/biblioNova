"""Science Mapping node: keyword co-occurrence and co-citation networks — via
genuine MCP discovery + invocation against science-mapping-server.
"""

from functools import partial

from agents.nodes.mcp_specialist import SummarizeFn, run_mcp_specialist

science_mapping_node = partial(
    run_mcp_specialist,
    agent_name="science_mapping",
    server_key="science_mapping",
    summary_prompt_name="science_mapping_summary.v1.md",
)

__all__ = ["science_mapping_node", "SummarizeFn"]
