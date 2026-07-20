"""Retry wrapper for structured-output LLM calls.

Smaller/faster models occasionally abandon the requested JSON schema for a
large or complex prompt — observed both as claude-3-haiku free-writing a
markdown report instead of GapAnalysis JSON once context grew past ~20K
characters, and as a single unescaped quote inside a free-text field (e.g.
executive_summary) breaking JSON syntax entirely, even though json_schema
mode is requested — smaller OpenRouter models don't always enforce it
strictly. That's a genuine external-system failure at the LLM boundary, not
something retried elsewhere in the pipeline — a couple of retries is cheap
insurance against it without masking a persistently broken prompt/schema
(which still raises after retries are exhausted).
"""

from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


async def invoke_with_retry(fn: Callable[[], Awaitable[T]], retries: int = 2) -> T:
    last_exc: Exception | None = None
    for _attempt in range(retries + 1):
        try:
            return await fn()
        except Exception as exc:  # noqa: BLE001 - any structured-output failure is retryable here
            last_exc = exc
    assert last_exc is not None
    raise last_exc
