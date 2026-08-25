"""Agentic Search end-to-end: search -> review/select -> confirm, with
Data Acquisition's real search_openalex/search_arxiv calls stubbed out (this
test never touches the network) but everything else -- to_bibtex's real
dedupe/generation, the router/session lifecycle, and bibtex-parser-server's
real parse -- genuine, confirming the resulting corpus flows through
parse_and_extract() identically to an uploaded file.
"""

import app.routers.acquisition as acquisition_router
from mcp_servers.data_acquisition.bibtex import to_bibtex

RAW_CANDIDATES = [
    {
        "source": "openalex",
        "source_id": f"https://openalex.org/W{i}",
        "title": f"Agentic AI Study Number {i}",
        "authors": [f"Author{i}, A."],
        "year": 2022 + (i % 3),
        "venue": "Journal of Agentic Systems",
        "abstract": "An abstract about agentic AI.",
        "doi": f"10.1234/paper{i}",
        "times_cited": i,
        "is_oa": True,
        "url": f"https://openalex.org/W{i}",
    }
    for i in range(6)
] + [
    # Deliberately missing authors -- to_bibtex omits the author field, and
    # bibtex-parser-server should skip it downstream exactly like a messy
    # uploaded entry, with a reason recorded, never a crash.
    {
        "source": "arxiv",
        "source_id": "http://arxiv.org/abs/9999.99999",
        "title": "A Preprint With No Listed Authors",
        "authors": [],
        "year": 2024,
        "venue": "",
        "abstract": "",
        "doi": "",
        "times_cited": 0,
        "is_oa": True,
        "url": "http://arxiv.org/abs/9999.99999",
    },
]


async def _fake_run_search(query, year_from, year_to, max_results, event_sink):
    await event_sink("agent_started", "data_acquisition", {"query": query})
    await event_sink(
        "tool_discovered",
        "data_acquisition",
        {"tools": ["search_openalex", "search_arxiv", "to_bibtex"]},
    )
    await event_sink(
        "tool_called",
        "data_acquisition",
        {"tool": "search_openalex", "source": "openalex", "duration_seconds": 0.1},
    )
    await event_sink(
        "tool_called",
        "data_acquisition",
        {"tool": "search_arxiv", "source": "arxiv", "duration_seconds": 0.1},
    )
    bibtex_result = to_bibtex(RAW_CANDIDATES)
    await event_sink(
        "tool_called",
        "data_acquisition",
        {"tool": "to_bibtex", "duration_seconds": 0.05, "duplicates_removed": 0},
    )
    candidates = bibtex_result["records"]
    await event_sink(
        "agent_completed",
        "data_acquisition",
        {"results_retrieved": len(candidates), "sources_used": ["openalex", "arxiv"]},
    )
    return {
        "sources_used": ["openalex", "arxiv"],
        "results_retrieved": len(candidates),
        "candidates": candidates,
        "clarification_message": None,
    }


def test_agentic_search_round_trip(client, monkeypatch):
    monkeypatch.setattr(acquisition_router, "run_search", _fake_run_search)

    search_response = client.post(
        "/sessions/search",
        json={"query": "agentic ai systems", "max_results": 50},
    )
    assert search_response.status_code == 201, search_response.text
    search_body = search_response.json()
    assert search_body["status"] == "awaiting_selection"
    assert search_body["results_retrieved"] == 7
    assert set(search_body["sources_used"]) == {"openalex", "arxiv"}
    assert len(search_body["candidates"]) == 7

    session_id = search_body["id"]

    detail = client.get(f"/sessions/{session_id}").json()
    assert detail["acquisition_mode"] == "agentic_search"
    assert detail["search_query"] == "agentic ai systems"
    assert detail["status"] == "awaiting_selection"
    assert detail["results_retrieved"] == 7

    events = client.get(f"/sessions/{session_id}/events").json()
    event_types = [e["event_type"] for e in events]
    assert event_types.count("tool_called") == 3
    assert {e["agent_name"] for e in events} == {"data_acquisition"}

    # User deselects one candidate (keeps 6 of 7).
    selected = [{"bibtex_entry": c["bibtex_entry"]} for c in search_body["candidates"][:6]]
    confirm_response = client.post(
        f"/sessions/{session_id}/confirm-search",
        json={"goal": "Identify emerging themes in agentic AI research.", "selected": selected},
    )
    assert confirm_response.status_code == 200, confirm_response.text
    confirm_body = confirm_response.json()
    assert confirm_body["status"] == "uploaded"
    # The deselected 7th candidate was the authorless one, so all 6 selected
    # here are the well-formed OpenAlex-sourced entries -- same corpus_stats
    # shape/behavior an uploaded file would produce.
    assert confirm_body["corpus_stats"]["valid_count"] == 6
    assert confirm_body["corpus_stats"]["skipped_count"] == 0

    final_detail = client.get(f"/sessions/{session_id}").json()
    assert final_detail["status"] == "uploaded"
    assert final_detail["results_selected"] == 6
    assert final_detail["goal"] == "Identify emerging themes in agentic AI research."
    # From here on the session is indistinguishable from an uploaded one --
    # status="uploaded", real corpus_stats/parsed_records -- so /analyze
    # (already covered end-to-end by test_integration_roundtrip.py against
    # an uploaded session) needs no separate re-proof here.


def test_confirm_search_includes_the_authorless_skip_when_selected(client, monkeypatch):
    monkeypatch.setattr(acquisition_router, "run_search", _fake_run_search)

    search_response = client.post(
        "/sessions/search", json={"query": "agentic ai", "max_results": 50}
    )
    session_id = search_response.json()["id"]
    candidates = search_response.json()["candidates"]

    # This time keep all 7, including the authorless preprint.
    selected = [{"bibtex_entry": c["bibtex_entry"]} for c in candidates]
    confirm_response = client.post(
        f"/sessions/{session_id}/confirm-search",
        json={"goal": "Survey agentic AI research broadly across sources.", "selected": selected},
    )
    assert confirm_response.status_code == 200
    stats = confirm_response.json()["corpus_stats"]
    assert stats["valid_count"] == 6
    assert stats["skipped_count"] == 1
    assert "missing required field" in stats["skipped"][0]["reason"]


def test_confirm_search_rejects_when_not_awaiting_selection(client, monkeypatch):
    monkeypatch.setattr(acquisition_router, "run_search", _fake_run_search)

    search_response = client.post(
        "/sessions/search", json={"query": "agentic ai", "max_results": 50}
    )
    session_id = search_response.json()["id"]
    candidates = search_response.json()["candidates"]
    selected = [{"bibtex_entry": c["bibtex_entry"]} for c in candidates[:6]]

    first = client.post(
        f"/sessions/{session_id}/confirm-search",
        json={"goal": "Identify emerging themes in agentic AI research.", "selected": selected},
    )
    assert first.status_code == 200

    second = client.post(
        f"/sessions/{session_id}/confirm-search",
        json={"goal": "Identify emerging themes in agentic AI research.", "selected": selected},
    )
    assert second.status_code == 409
