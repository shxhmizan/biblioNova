"""Registry of MCP servers this backend spawns as stdio subprocesses.

Both the synchronous upload/parse path (app/services/mcp_tools.py) and the
agentic discovery path (agents/mcp_client.py) build their connection config
from here, so there is exactly one place that knows how each server is launched.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

MCP_SERVER_MODULES: dict[str, str] = {
    "bibtex_parser": "mcp_servers.bibtex_parser.server",
    "bibliometric_analysis": "mcp_servers.bibliometric_analysis.server",
    "science_mapping": "mcp_servers.science_mapping.server",
    "data_acquisition": "mcp_servers.data_acquisition.server",
}


def stdio_params(server_key: str) -> dict:
    """Params for launching a registered MCP server as a stdio subprocess."""
    module = MCP_SERVER_MODULES[server_key]
    return {
        "command": sys.executable,
        "args": ["-m", module],
        "cwd": str(BACKEND_DIR),
    }
