import pytest

from agents.nodes.research_advisor import research_advisor_node
from agents.schemas import Recommendation, RecommendationSet

GAPS = [
    {
        "id": "gap-1",
        "title": "Gap One",
        "evidence": "e1",
        "confidence": "high",
        "supporting_record_ids": [],
    },
    {
        "id": "gap-2",
        "title": "Gap Two",
        "evidence": "e2",
        "confidence": "medium",
        "supporting_record_ids": [],
    },
]


def _base_state():
    return {
        "goal": "Find gaps.",
        "corpus_stats": {"valid_count": 2, "year_min": 2020, "year_max": 2021, "skipped_count": 0},
        "records": [],
        "results": {"insights_reporting": {"gaps": GAPS, "executive_summary": "Summary."}},
        "summaries": {"insights_reporting": "Summary."},
    }


async def test_research_advisor_maps_recommendations_1_to_1_by_position():
    async def fake_recommend(goal, gaps):
        return RecommendationSet(
            recommendations=[
                Recommendation(topic="Topic A", rationale="r1", suggested_methodology="m1"),
                Recommendation(topic="Topic B", rationale="r2", suggested_methodology="m2"),
            ]
        )

    result = await research_advisor_node(_base_state(), recommend_fn=fake_recommend)

    recs = result["results"]["research_advisor"]["recommendations"]
    assert recs[0]["addresses_gap_id"] == "gap-1"
    assert recs[1]["addresses_gap_id"] == "gap-2"
    assert result["report_pdf"][:4] == b"%PDF"
    assert result["report_page_count"] >= 1


async def test_research_advisor_raises_on_recommendation_count_mismatch():
    async def fake_recommend(goal, gaps):
        return RecommendationSet(
            recommendations=[
                Recommendation(topic="Only one", rationale="r", suggested_methodology="m")
            ]
        )

    with pytest.raises(RuntimeError, match="1:1"):
        await research_advisor_node(_base_state(), recommend_fn=fake_recommend)
