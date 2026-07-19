"""Event sink protocol used by graph nodes to emit structured progress events.

Nodes never talk to the database directly — they call an injected sink, so
they stay unit-testable without a DB and the persistence mechanism (Postgres
today, WebSocket fan-out later) can change without touching node code.
"""

from collections.abc import Awaitable, Callable

EventSink = Callable[[str, str | None, dict], Awaitable[None]]


async def noop_sink(event_type: str, agent_name: str | None, payload: dict) -> None:
    return None
