"""Coordinator node: routes the goal to a subset of specialists via LLM reasoning.

The `decision_fn` seam exists so the routing decision — the thesis evaluation
metric — can be tested with fixed fixtures without hitting a real LLM. The
default path is the genuine OpenRouter-backed decision used at runtime.
"""

import json
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.prompts_loader import load_prompt
from agents.schemas import RoutingDecision
from agents.state import GraphState
from app.config import settings

SPECIALIST_DESCRIPTIONS: dict[str, str] = {
    "bibliometric_analyst": (
        "Bibliometric Analyst — publication trends over time, citation analysis, "
        "author/journal rankings."
    ),
    "science_mapping": (
        "Science Mapping — keyword co-occurrence and co-citation networks revealing "
        "thematic structure."
    ),
    "text_mining": (
        "Text Mining — semantic clustering of titles/abstracts into auto-labeled themes."
    ),
}

DecisionFn = Callable[[str, dict, list[str]], Awaitable[RoutingDecision]]


def build_routing_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0,
    )


async def _llm_decide_routing(
    goal: str, corpus_stats: dict, available_specialists: list[str]
) -> RoutingDecision:
    specialist_list = "\n".join(f"- {SPECIALIST_DESCRIPTIONS[s]}" for s in available_specialists)
    prompt = Template(load_prompt("coordinator_routing.v1.md")).safe_substitute(
        specialist_list=specialist_list,
        goal=goal,
        corpus_stats_json=json.dumps(corpus_stats, indent=2),
    )
    llm = build_routing_llm().with_structured_output(RoutingDecision)
    return await llm.ainvoke(prompt)


async def decide_routing(
    goal: str,
    corpus_stats: dict,
    available_specialists: list[str],
    decision_fn: DecisionFn | None = None,
) -> RoutingDecision:
    fn = decision_fn or _llm_decide_routing
    return await fn(goal, corpus_stats, available_specialists)


async def coordinator_node(
    state: GraphState,
    available_specialists: list[str],
    event_sink: EventSink = noop_sink,
    decision_fn: DecisionFn | None = None,
) -> GraphState:
    await event_sink("agent_started", "coordinator", {"goal": state["goal"]})

    decision = await decide_routing(
        state["goal"], state["corpus_stats"], available_specialists, decision_fn
    )

    if decision.clarification_needed or not decision.activated:
        await event_sink(
            "agent_completed",
            "coordinator",
            {"outcome": "clarification_needed", "message": decision.clarification_message},
        )
        return {
            **state,
            "routing_decision": decision.model_dump(),
            "needs_clarification": True,
        }

    # Skip events for non-activated specialists are emitted by each specialist
    # node itself, lazily, when the sequential pipeline reaches it — this keeps
    # the live progress stream reading as a real sequence rather than a burst.
    await event_sink(
        "agent_completed",
        "coordinator",
        {
            "activated": decision.activated,
            "skipped": [s.model_dump() for s in decision.skipped],
            "justification": decision.justification,
        },
    )

    return {
        **state,
        "routing_decision": decision.model_dump(),
        "needs_clarification": False,
    }
