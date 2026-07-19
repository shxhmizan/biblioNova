from agents.nodes.insights_reporting import insights_reporting_node
from agents.schemas import Gap, GapAnalysis


async def _fake_gap_fn(goal, specialist_results, record_ids):
    return GapAnalysis(
        gaps=[
            Gap(
                title="Underexplored intersection",
                evidence="Only 2 of the corpus records touch this theme.",
                confidence="medium",
                supporting_record_ids=[record_ids[0], "not-a-real-id"],
            )
        ],
        executive_summary="Overall synthesis of the analysis.",
    )


async def test_insights_reporting_node_assigns_gap_ids_and_drops_unknown_record_ids():
    events = []

    async def sink(event_type, agent_name, payload):
        events.append((event_type, agent_name, payload))

    state = {
        "goal": "Find gaps in agentic AI research.",
        "records": [{"id": "a", "title": "A"}, {"id": "b", "title": "B"}],
        "results": {"bibliometric_analyst": {"publication_trend": {}}},
        "summaries": {"bibliometric_analyst": "Trend summary."},
    }

    result = await insights_reporting_node(state, event_sink=sink, gap_analysis_fn=_fake_gap_fn)

    gaps = result["results"]["insights_reporting"]["gaps"]
    assert gaps[0]["id"] == "gap-1"
    assert gaps[0]["supporting_record_ids"] == ["a"]  # hallucinated id dropped
    assert result["summaries"]["insights_reporting"] == "Overall synthesis of the analysis."
    assert ("agent_started", "insights_reporting", {}) in events
    completed = [e for e in events if e[0] == "agent_completed"][0]
    assert completed[2]["gap_count"] == 1
