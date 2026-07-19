"""bibliometric-analysis-server: MCP server for the Bibliometric Analyst specialist.

Phase 1 exposes publication_trend() only. citation_analysis() (and full
author/journal ranking) is added in Phase 2 — until then it must not be
advertised via tools/list, since agents discover capability dynamically.

Run standalone for manual testing:
    uv run python -m mcp_servers.bibliometric_analysis.server
"""

from mcp.server.fastmcp import FastMCP

from mcp_servers.bibliometric_analysis import analysis

mcp = FastMCP("bibliometric-analysis-server")


@mcp.tool()
def publication_trend(records: list[dict]) -> dict:
    """Compute publications-per-year and citations-per-year for a parsed corpus.

    Args:
        records: Parsed BibTeX records as returned by bibtex-parser-server's parse_bibtex.
    """
    return analysis.publication_trend(records)


if __name__ == "__main__":
    mcp.run()
