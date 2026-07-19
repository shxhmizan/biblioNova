"""bibtex-parser-server: MCP server exposing parse_bibtex() and extract_metadata().

Run standalone for manual testing:
    uv run python -m mcp_servers.bibtex_parser.server
"""

from mcp.server.fastmcp import FastMCP

from mcp_servers.bibtex_parser import parsing

mcp = FastMCP("bibtex-parser-server")


@mcp.tool()
def parse_bibtex(content: str) -> dict:
    """Parse raw BibTeX text into validated records, skipping malformed entries.

    Args:
        content: Raw contents of a .bib file exported from Web of Science.
    """
    return parsing.parse_bibtex(content)


@mcp.tool()
def extract_metadata(records: list[dict], skipped: list[dict] | None = None) -> dict:
    """Compute corpus-level statistics (record count, year range, dedupe/skip counts)
    from records already produced by parse_bibtex.

    Args:
        records: The `records` list returned by parse_bibtex.
        skipped: The `skipped` list returned by parse_bibtex, for reporting.
    """
    return parsing.extract_metadata(records, skipped)


if __name__ == "__main__":
    mcp.run()
