"""bibliometric-analysis-server: MCP server for the Bibliometric Analyst specialist.

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


@mcp.tool()
def citation_analysis(records: list[dict], top_n: int = 10) -> dict:
    """Citation totals plus top-cited papers, authors, and journals.

    Args:
        records: Parsed BibTeX records as returned by bibtex-parser-server's parse_bibtex.
        top_n: How many top-ranked papers/authors/journals to return.
    """
    return analysis.citation_analysis(records, top_n=top_n)


@mcp.tool()
def coauthorship_network_analysis(records: list[dict], top_n: int = 10) -> dict:
    """Author-level co-authorship collaboration network plus top collaborating pairs.

    Args:
        records: Parsed BibTeX records as returned by bibtex-parser-server's parse_bibtex.
        top_n: How many top collaborating author pairs to return.
    """
    return analysis.coauthorship_network_analysis(records, top_n=top_n)


if __name__ == "__main__":
    mcp.run()
