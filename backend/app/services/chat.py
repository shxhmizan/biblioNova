"""Read-only, analysis-grounded chat. Never re-runs agents or calls MCP tools —
answers are generated from the session's already-stored analysis JSON only.
"""

import json
from collections.abc import Awaitable, Callable
from string import Template

from langchain_openai import ChatOpenAI

from agents.prompts_loader import load_prompt
from app.config import settings
from app.models import AnalysisResult, AnalysisSession

AnswerFn = Callable[[str, str, str], Awaitable[str]]


def build_chat_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0.2,
    )


async def _llm_answer(goal: str, analysis_json: str, question: str) -> str:
    prompt = Template(load_prompt("chat.v1.md")).safe_substitute(
        goal=goal, analysis_json=analysis_json, question=question
    )
    response = await build_chat_llm().ainvoke(prompt)
    return response.content


def build_grounding_context(session: AnalysisSession, results: list[AnalysisResult]) -> dict:
    return {
        "corpus_stats": session.corpus_stats,
        "routing_decision": session.routing_decision,
        "executive_summary": session.executive_summary,
        "results": {r.agent_name: r.result_json for r in results},
    }


async def answer_question(
    session: AnalysisSession,
    results: list[AnalysisResult],
    question: str,
    answer_fn: AnswerFn | None = None,
) -> str:
    context = build_grounding_context(session, results)
    fn = answer_fn or _llm_answer
    return await fn(session.goal, json.dumps(context, indent=2), question)
