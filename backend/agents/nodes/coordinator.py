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
from agents.llm_retry import invoke_with_retry
from agents.prompts_loader import load_prompt
from agents.schemas import RoutingDecision
from agents.state import GraphState
from app.config import settings

SPECIALIST_DESCRIPTIONS: dict[str, str] = {
    "bibliometric_analyst": (
        "publication trends over time, citation analysis, author/journal rankings, "
        "co-authorship collaboration networks."
    ),
    "science_mapping": (
        "keyword co-occurrence, co-citation, and bibliographic coupling networks "
        "revealing thematic structure."
    ),
    "text_mining": "semantic clustering of titles/abstracts into auto-labeled themes.",
}

DecisionFn = Callable[[str, dict, list[str]], Awaitable[RoutingDecision]]


def build_routing_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0,
        max_tokens=2048,
    )


async def _llm_decide_routing(
    goal: str, corpus_stats: dict, available_specialists: list[str]
) -> RoutingDecision:
    specialist_list = "\n".join(
        f"- `{s}` — {SPECIALIST_DESCRIPTIONS[s]}" for s in available_specialists
    )
    prompt = Template(load_prompt("coordinator_routing.v1.md")).safe_substitute(
        specialist_list=specialist_list,
        goal=goal,
        corpus_stats_json=json.dumps(corpus_stats, indent=2),
    )
    # method="json_schema" pinned explicitly: langchain's default method
    # selection is unreliable for this model on structured schemas (observed
    # falling back to free-text/markdown output for more complex schemas).
    llm = build_routing_llm().with_structured_output(RoutingDecision, method="json_schema")
    return await invoke_with_retry(lambda: llm.ainvoke(prompt))


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
