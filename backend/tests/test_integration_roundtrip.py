"""End-to-end round trip: upload sample.bib -> goal -> coordinator routes ->
activated specialists discover + call MCP tools (or run in-process for Text
Mining) -> JSON results persisted.

All LLM calls (routing decision, per-specialist summaries) are faked (no
network/API key needed); everything else — MCP subprocess discovery,
tools/call execution, DB persistence, real GMM clustering over fake
embeddings — is the real thing.
"""

from pathlib import Path

import numpy as np

from agents.schemas import RoutingDecision
from app.services import analysis_runner

SAMPLE_BIB = Path(__file__).resolve().parents[2] / "data" / "samples" / "sample.bib"


async def _fake_summarize_fn(goal, result):
    return f"Summary for goal '{goal}' over result keys: {sorted(result.keys())}."


def _fake_embed_fn(texts: list[str]) -> np.ndarray:
    # Deterministic, network-free stand-in for sentence-transformers: hash each
    # text into a small fixed-size vector so real GMM clustering still runs.
    rng = np.random.default_rng(42)
    base = rng.normal(size=(4, 8))
    return np.array([base[hash(t) % 4] + rng.normal(scale=0.01, size=8) for t in texts])


def _patch_graph(monkeypatch, decision_fn):
    import agents.graph as graph_module

    original_build_graph = graph_module.build_graph

    def patched_build_graph(event_sink, **_ignored_defaults):
        return original_build_graph(
            event_sink=event_sink,
            decision_fn=decision_fn,
            bibliometric_summarize_fn=_fake_summarize_fn,
            science_mapping_summarize_fn=_fake_summarize_fn,
            text_mining_embed_fn=_fake_embed_fn,
            text_mining_summarize_fn=_fake_summarize_fn,
        )

    monkeypatch.setattr(analysis_runner, "build_graph", patched_build_graph)


def _upload_sample(client, goal: str) -> dict:
    with open(SAMPLE_BIB, "rb") as f:
        response = client.post(
            "/sessions",
            files={"file": ("sample.bib", f, "text/plain")},
            data={"goal": goal},
        )
    assert response.status_code == 201, response.text
    return response.json()


def test_single_specialist_round_trip(client, monkeypatch):
    async def fake_decision(goal, corpus_stats, available):
        return RoutingDecision(
            activated=["bibliometric_analyst"],
            skipped=[
                {"agent": "science_mapping", "reason": "Goal does not concern keyword networks."},
                {"agent": "text_mining", "reason": "Goal does not require semantic clustering."},
            ],
            justification="The goal explicitly asks about publication trends over time.",
        )

    _patch_graph(monkeypatch, fake_decision)

    session = _upload_sample(
        client, "Analyze how publications on agentic AI have trended over time in this corpus."
    )
    assert session["corpus_stats"]["valid_count"] == 46
    assert session["corpus_stats"]["skipped_count"] == 4
    assert session["corpus_stats"]["year_min"] == 2015
    assert session["corpus_stats"]["year_max"] == 2026

    session_id = session["id"]
    analyze_response = client.post(f"/sessions/{session_id}/analyze")
    assert analyze_response.status_code == 200
    assert analyze_response.json()["status"] == "running"

    detail = client.get(f"/sessions/{session_id}").json()
    assert detail["status"] == "completed"
    assert detail["routing_decision"]["activated"] == ["bibliometric_analyst"]
    assert detail["executive_summary"]

    results = {
        r["agent_name"]: r["result_json"]
        for r in client.get(f"/sessions/{session_id}/results").json()
    }
    assert list(results.keys()) == ["bibliometric_analyst"]
    trend = results["bibliometric_analyst"]["publication_trend"]
    assert trend["total_publications"] == 46
    assert trend["year_range"] == [2015, 2026]
    citations = results["bibliometric_analyst"]["citation_analysis"]
    assert citations["total_publications"] == 46
    assert len(citations["top_authors"]) > 0

    events = client.get(f"/sessions/{session_id}/events").json()
    event_types = [e["event_type"] for e in events]
    assert event_types.count("tool_called") == 2  # publication_trend + citation_analysis
    assert "tool_discovered" in event_types

    skipped = {e["agent_name"] for e in events if e["event_type"] == "agent_skipped"}
    assert skipped == {"science_mapping", "text_mining"}


def test_all_specialists_activated_round_trip(client, monkeypatch):
    async def fake_decision(goal, corpus_stats, available):
        return RoutingDecision(
            activated=list(available),
            skipped=[],
            justification="The goal spans trends, thematic structure, and semantic clusters.",
        )

    _patch_graph(monkeypatch, fake_decision)

    session = _upload_sample(
        client,
        "Give me a full picture: publication trends, keyword networks, and semantic clusters.",
    )
    session_id = session["id"]
    client.post(f"/sessions/{session_id}/analyze")

    detail = client.get(f"/sessions/{session_id}").json()
    assert detail["status"] == "completed"
    assert set(detail["routing_decision"]["activated"]) == {
        "bibliometric_analyst",
        "science_mapping",
        "text_mining",
    }

    results = {
        r["agent_name"]: r["result_json"]
        for r in client.get(f"/sessions/{session_id}/results").json()
    }
    assert set(results.keys()) == {"bibliometric_analyst", "science_mapping", "text_mining"}

    co_occurrence = results["science_mapping"]["co_occurrence_analysis"]
    assert len(co_occurrence["nodes"]) > 0

    clusters = results["text_mining"]["clusters"]
    assert results["text_mining"]["n_clusters"] > 0
    assert sum(c["size"] for c in clusters) == 46

    events = client.get(f"/sessions/{session_id}/events").json()
    assert not any(e["event_type"] == "agent_skipped" for e in events)
