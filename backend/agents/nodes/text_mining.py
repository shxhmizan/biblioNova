"""Text Mining node: semantic clustering via sentence-transformers embeddings +
Gaussian Mixture Models, run in-process (no MCP server, per architecture).
"""

import json
from collections.abc import Awaitable, Callable
from string import Template

import numpy as np
from langchain_openai import ChatOpenAI

from agents.events import EventSink, noop_sink
from agents.nodes.common import maybe_skip
from agents.prompts_loader import load_prompt
from agents.state import GraphState
from agents.text_mining_analysis import choose_n_clusters, cluster_records, embed_texts
from app.config import settings

EmbedFn = Callable[[list[str]], np.ndarray]
SummarizeFn = Callable[[str, dict], Awaitable[str]]


def build_summary_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0.2,
    )


async def _llm_summarize(goal: str, cluster_result: dict) -> str:
    prompt = Template(load_prompt("text_mining_summary.v1.md")).safe_substitute(
        goal=goal, result_json=json.dumps(cluster_result, indent=2)
    )
    response = await build_summary_llm().ainvoke(prompt)
    return response.content


async def summarize_clusters(
    goal: str, cluster_result: dict, summarize_fn: SummarizeFn | None = None
) -> str:
    fn = summarize_fn or _llm_summarize
    return await fn(goal, cluster_result)


def _record_text(record: dict) -> str:
    title = record.get("title", "")
    abstract = record.get("abstract", "")
    return f"{title}. {abstract}".strip()


async def text_mining_node(
    state: GraphState,
    event_sink: EventSink = noop_sink,
    embed_fn: EmbedFn | None = None,
    summarize_fn: SummarizeFn | None = None,
) -> GraphState:
    if await maybe_skip(state, "text_mining", event_sink):
        return state

    await event_sink("agent_started", "text_mining", {})

    records = state["records"]
    texts = [_record_text(r) for r in records]
    embed = embed_fn or embed_texts
    embeddings = embed(texts)

    n_clusters = choose_n_clusters(len(records))
    cluster_result = cluster_records(records, embeddings, n_clusters)

    summary = await summarize_clusters(state["goal"], cluster_result, summarize_fn)

    await event_sink("agent_completed", "text_mining", {"n_clusters": cluster_result["n_clusters"]})

    return {
        **state,
        "results": {**state.get("results", {}), "text_mining": cluster_result},
        "summaries": {**state.get("summaries", {}), "text_mining": summary},
    }
