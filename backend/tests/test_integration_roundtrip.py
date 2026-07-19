"""End-to-end Phase 1 round trip: upload sample.bib -> goal -> coordinator routes
-> Bibliometric Analyst discovers + calls MCP tools -> JSON result persisted.

The Coordinator's routing LLM call and the Analyst's summary LLM call are
faked (no network/API key needed); everything else — MCP subprocess discovery,
tools/call execution, DB persistence — is the real thing.
"""

from pathlib import Path

from agents.schemas import RoutingDecision
from app.services import analysis_runner

SAMPLE_BIB = Path(__file__).resolve().parents[2] / "data" / "samples" / "sample.bib"
GOAL = "Analyze how publications on agentic AI have trended over time in this corpus."


async def _fake_decision_fn(goal, corpus_stats, available):
    return RoutingDecision(
        activated=["bibliometric_analyst"],
        skipped=[],
        justification="The goal explicitly asks about publication trends over time.",
    )


async def _fake_summarize_fn(goal, trend_result):
    return (
        f"Publications span {trend_result['year_range'][0]}-{trend_result['year_range'][1]} "
        f"with {trend_result['total_publications']} total records."
    )


def _patch_graph_fakes(monkeypatch):
    import agents.graph as graph_module

    original_build_graph = graph_module.build_graph

    def patched_build_graph(event_sink, decision_fn=None, summarize_fn=None):
        return original_build_graph(
            event_sink=event_sink,
            decision_fn=_fake_decision_fn,
            summarize_fn=_fake_summarize_fn,
        )

    monkeypatch.setattr(analysis_runner, "build_graph", patched_build_graph)


def test_full_round_trip(client, monkeypatch):
    _patch_graph_fakes(monkeypatch)

    with open(SAMPLE_BIB, "rb") as f:
        upload_response = client.post(
            "/sessions",
            files={"file": ("sample.bib", f, "text/plain")},
            data={"goal": GOAL},
        )
    assert upload_response.status_code == 201, upload_response.text
    session = upload_response.json()

    assert session["corpus_stats"]["valid_count"] == 46
    assert session["corpus_stats"]["skipped_count"] == 4
    assert session["corpus_stats"]["year_min"] == 2015
    assert session["corpus_stats"]["year_max"] == 2026

    session_id = session["id"]

    analyze_response = client.post(f"/sessions/{session_id}/analyze")
    assert analyze_response.status_code == 200
    assert analyze_response.json()["status"] == "running"

    detail_response = client.get(f"/sessions/{session_id}")
    detail = detail_response.json()
    assert detail["status"] == "completed"
    assert detail["routing_decision"]["activated"] == ["bibliometric_analyst"]
    assert detail["executive_summary"]

    results_response = client.get(f"/sessions/{session_id}/results")
    results = results_response.json()
    assert len(results) == 1
    assert results[0]["agent_name"] == "bibliometric_analyst"
    trend = results[0]["result_json"]
    assert trend["total_publications"] == 46
    assert trend["year_range"] == [2015, 2026]

    events_response = client.get(f"/sessions/{session_id}/events")
    events = events_response.json()
    event_types = [e["event_type"] for e in events]
    assert "agent_started" in event_types
    assert "tool_discovered" in event_types
    assert "tool_called" in event_types
    assert "agent_completed" in event_types
