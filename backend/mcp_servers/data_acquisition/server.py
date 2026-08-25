"""data-acquisition-server: MCP server for the Data Acquisition agent.

Run standalone for manual testing:
    uv run python -m mcp_servers.data_acquisition.server
"""

from mcp.server.fastmcp import FastMCP

from app.config import settings
from mcp_servers.data_acquisition import bibtex, sources

mcp = FastMCP("data-acquisition-server")


@mcp.tool()
async def search_openalex(
    query: str,
    max_results: int = 50,
    year_from: int | None = None,
    year_to: int | None = None,
) -> list[dict]:
    """Search the OpenAlex Works API for papers matching a research area/title.

    Args:
        query: Free-text research area or title to search for.
        max_results: Maximum number of results to return (OpenAlex caps per-page at 200).
        year_from: Optional inclusive lower bound on publication year.
        year_to: Optional inclusive upper bound on publication year.
    """
    return await sources.search_openalex(
        query,
        max_results=max_results,
        year_from=year_from,
        year_to=year_to,
        mailto=settings.openalex_mailto or None,
    )


@mcp.tool()
async def search_arxiv(query: str, max_results: int = 50) -> list[dict]:
    """Search the arXiv API for preprints matching a research area/title.

    Args:
        query: Free-text research area or title to search for.
        max_results: Maximum number of results to return.
    """
    return await sources.search_arxiv(query, max_results=max_results)


@mcp.tool()
def to_bibtex(records: list[dict]) -> dict:
    """Dedupe cross-source records and convert each into a standalone BibTeX entry.

    Args:
        records: Normalized records from search_openalex and/or search_arxiv, merged.
    """
    return bibtex.to_bibtex(records)


if __name__ == "__main__":
    mcp.run()
