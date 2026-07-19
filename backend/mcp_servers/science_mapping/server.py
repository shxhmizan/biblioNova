"""science-mapping-server: MCP server for the Science Mapping specialist.

Run standalone for manual testing:
    uv run python -m mcp_servers.science_mapping.server
"""

from mcp.server.fastmcp import FastMCP

from mcp_servers.science_mapping import analysis

mcp = FastMCP("science-mapping-server")


@mcp.tool()
def co_occurrence_analysis(records: list[dict], min_frequency: int = 2) -> dict:
    """Build a keyword co-occurrence network, clustered by community detection.

    Args:
        records: Parsed BibTeX records as returned by bibtex-parser-server's parse_bibtex.
        min_frequency: Minimum corpus-wide frequency for a keyword to appear as a node.
    """
    return analysis.co_occurrence_analysis(records, min_frequency=min_frequency)


@mcp.tool()
def cocitation_analysis(records: list[dict]) -> dict:
    """Build a paper co-citation network from each record's cited_references field.

    Args:
        records: Parsed BibTeX records as returned by bibtex-parser-server's parse_bibtex.
    """
    return analysis.cocitation_analysis(records)


if __name__ == "__main__":
    mcp.run()
