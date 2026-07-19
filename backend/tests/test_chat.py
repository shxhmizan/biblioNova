from app.models import AnalysisResult, AnalysisSession
from app.services.chat import answer_question, build_grounding_context


def _session():
    return AnalysisSession(
        id="s1",
        name="sample",
        filename="sample.bib",
        goal="Find gaps in agentic AI research.",
        status="completed",
        raw_bib="",
        corpus_stats={"valid_count": 46},
        parsed_records=[],
        routing_decision={"activated": ["bibliometric_analyst"], "skipped": []},
        executive_summary="Overall synthesis.",
    )


def test_build_grounding_context_includes_results_keyed_by_agent():
    session = _session()
    results = [
        AnalysisResult(
            session_id="s1",
            agent_name="bibliometric_analyst",
            result_json={"total_publications": 46},
        )
    ]
    context = build_grounding_context(session, results)
    assert context["results"]["bibliometric_analyst"]["total_publications"] == 46
    assert context["executive_summary"] == "Overall synthesis."


async def test_answer_question_uses_injected_fn_never_touching_llm():
    session = _session()

    async def fake_answer(goal, analysis_json, question):
        assert goal == session.goal
        assert "46" in analysis_json
        return f"Answering: {question}"

    answer = await answer_question(session, [], "How many publications?", answer_fn=fake_answer)
    assert answer == "Answering: How many publications?"
