"""Tests run against a real in-process data-acquisition-server (real
tools/list, real to_bibtex dedupe/generation) over in-memory MCP streams --
only sources.search_openalex/search_arxiv (the network-calling leaf
functions) are faked, via the mcp_servers.data_acquisition.server module
that backs the in-process session.
"""

from mcp.shared.memory import create_connected_server_and_client_session

from app.services.data_acquisition import MIN_RESULTS, run_search
from mcp_servers.data_acquisition import server as data_acquisition_server


def _in_process_session_factory():
    return create_connected_server_and_client_session(data_acquisition_server.mcp)


async def _collect_events(sink_calls, event_type, agent_name, payload):
    sink_calls.append((event_type, agent_name, payload))


def _make_record(title: str, doi: str = "", source: str = "openalex") -> dict:
    return {
        "source": source,
        "source_id": title,
        "title": title,
        "authors": ["Chen, L."],
        "year": 2023,
        "venue": "Journal of AI",
        "abstract": "An abstract.",
        "doi": doi,
        "times_cited": 3,
        "is_oa": True,
        "url": "",
    }


async def test_run_search_below_minimum_returns_clarification(monkeypatch):
    async def fake_openalex(query, max_results=50, year_from=None, year_to=None, mailto=None):
        return [_make_record("Only Paper One")]

    async def fake_arxiv(query, max_results=50):
        return [_make_record("Only Paper Two", source="arxiv")]

    monkeypatch.setattr(data_acquisition_server.sources, "search_openalex", fake_openalex)
    monkeypatch.setattr(data_acquisition_server.sources, "search_arxiv", fake_arxiv)

    events = []

    async def sink(event_type, agent_name, payload):
        events.append((event_type, agent_name, payload))

    result = await run_search(
        "a very narrow query",
        None,
        None,
        50,
        event_sink=sink,
        session_factory=_in_process_session_factory,
    )

    assert result["results_retrieved"] == 2
    assert result["results_retrieved"] < MIN_RESULTS
    assert result["clarification_message"] is not None
    assert "broader" in result["clarification_message"]
    assert {e[0] for e in events} == {
        "agent_started",
        "tool_discovered",
        "tool_called",
        "agent_completed",
    }
    completed = next(e for e in events if e[0] == "agent_completed")
    assert completed[2]["outcome"] == "clarification_needed"


async def test_run_search_above_minimum_succeeds_and_reports_sources(monkeypatch):
    async def fake_openalex(query, max_results=50, year_from=None, year_to=None, mailto=None):
        return [_make_record(f"OpenAlex Paper {i}", doi=f"10.1/{i}") for i in range(4)]

    async def fake_arxiv(query, max_results=50):
        return [_make_record(f"arXiv Paper {i}", source="arxiv") for i in range(3)]

    monkeypatch.setattr(data_acquisition_server.sources, "search_openalex", fake_openalex)
    monkeypatch.setattr(data_acquisition_server.sources, "search_arxiv", fake_arxiv)

    events = []

    async def sink(event_type, agent_name, payload):
        events.append((event_type, agent_name, payload))

    result = await run_search(
        "agentic ai in healthcare",
        2020,
        2026,
        50,
        event_sink=sink,
        session_factory=_in_process_session_factory,
    )

    assert result["results_retrieved"] == 7
    assert result["clarification_message"] is None
    assert set(result["sources_used"]) == {"openalex", "arxiv"}
    assert all("bibtex_entry" in c and "bibtex_key" in c for c in result["candidates"])

    tool_called_events = [e for e in events if e[0] == "tool_called"]
    tool_names = {e[2]["tool"] for e in tool_called_events}
    assert tool_names == {"search_openalex", "search_arxiv", "to_bibtex"}


async def test_run_search_deduplicates_across_sources(monkeypatch):
    shared_doi = "10.5555/shared"

    async def fake_openalex(query, max_results=50, year_from=None, year_to=None, mailto=None):
        return [_make_record("Shared Paper", doi=shared_doi)] + [
            _make_record(f"Unique OA {i}", doi=f"10.1/{i}") for i in range(4)
        ]

    async def fake_arxiv(query, max_results=50):
        return [_make_record("Shared Paper (preprint)", doi=shared_doi, source="arxiv")]

    monkeypatch.setattr(data_acquisition_server.sources, "search_openalex", fake_openalex)
    monkeypatch.setattr(data_acquisition_server.sources, "search_arxiv", fake_arxiv)

    result = await run_search(
        "agentic ai", None, None, 50, session_factory=_in_process_session_factory
    )

    # 5 openalex + 1 arxiv = 6 raw records, but the arxiv one shares a DOI
    # with "Shared Paper" -- exactly one should be deduped away.
    assert result["results_retrieved"] == 5
