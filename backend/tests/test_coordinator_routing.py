from agents.nodes.coordinator import coordinator_node
from agents.schemas import RoutingDecision, SpecialistSkip


async def _events_collector():
    events: list[tuple[str, str | None, dict]] = []

    async def sink(event_type: str, agent_name: str | None, payload: dict) -> None:
        events.append((event_type, agent_name, payload))

    return events, sink


async def test_activates_specialist_when_goal_matches():
    events, sink = await _events_collector()

    async def fixed_decision(goal, corpus_stats, available):
        return RoutingDecision(
            activated=["bibliometric_analyst"],
            skipped=[],
            justification="Goal asks about publication trends over time.",
        )

    state = {
        "goal": "How have publications on agentic AI trended since 2018?",
        "corpus_stats": {"record_count": 50, "year_min": 2015, "year_max": 2026},
    }
    result = await coordinator_node(
        state,
        available_specialists=["bibliometric_analyst"],
        event_sink=sink,
        decision_fn=fixed_decision,
    )

    assert result["needs_clarification"] is False
    assert result["routing_decision"]["activated"] == ["bibliometric_analyst"]
    assert ("agent_started", "coordinator", {"goal": state["goal"]}) in events
    completed = [e for e in events if e[0] == "agent_completed"][0]
    assert completed[2]["activated"] == ["bibliometric_analyst"]


async def test_skip_reasons_are_persisted_in_routing_decision():
    events, sink = await _events_collector()

    async def fixed_decision(goal, corpus_stats, available):
        return RoutingDecision(
            activated=["bibliometric_analyst"],
            skipped=[
                SpecialistSkip(
                    agent="science_mapping",
                    reason="Goal does not ask about keyword or citation networks.",
                )
            ],
            justification="Only trend analysis is relevant to this goal.",
        )

    state = {"goal": "Show me publication counts by year.", "corpus_stats": {}}
    result = await coordinator_node(
        state,
        available_specialists=["bibliometric_analyst", "science_mapping"],
        event_sink=sink,
        decision_fn=fixed_decision,
    )

    assert result["routing_decision"]["skipped"][0]["agent"] == "science_mapping"
    # The coordinator itself doesn't emit agent_skipped — each specialist node
    # does that lazily, when the sequential pipeline reaches it (see
    # agents/nodes/common.py::maybe_skip and the graph/integration tests).
    assert not any(e[0] == "agent_skipped" for e in events)
    completed = [e for e in events if e[0] == "agent_completed"][0]
    assert completed[2]["skipped"] == [
        {"agent": "science_mapping", "reason": "Goal does not ask about keyword or citation networks."}
    ]


async def test_unanalyzable_goal_returns_clarification_without_activating_anything():
    events, sink = await _events_collector()

    async def fixed_decision(goal, corpus_stats, available):
        return RoutingDecision(
            activated=[],
            skipped=[],
            justification="",
            clarification_needed=True,
            clarification_message="This goal isn't related to bibliometric analysis.",
        )

    state = {"goal": "What's the weather like today?", "corpus_stats": {}}
    result = await coordinator_node(
        state,
        available_specialists=["bibliometric_analyst"],
        event_sink=sink,
        decision_fn=fixed_decision,
    )

    assert result["needs_clarification"] is True
    assert result["routing_decision"]["activated"] == []
    assert not any(e[0] == "agent_skipped" for e in events)


async def test_empty_activation_without_clarification_flag_is_still_treated_as_clarification():
    async def fixed_decision(goal, corpus_stats, available):
        return RoutingDecision(activated=[], skipped=[], justification="Nothing matched.")

    state = {"goal": "Some ambiguous goal that maps to nothing.", "corpus_stats": {}}
    result = await coordinator_node(
        state, available_specialists=["bibliometric_analyst"], decision_fn=fixed_decision
    )

    assert result["needs_clarification"] is True
