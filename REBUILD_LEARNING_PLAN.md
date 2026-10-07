# BiblioNova: Learning-First Rebuild Plan

## Purpose

Rebuild the current BiblioNova/BiblioAgent concept from an empty repository in a way that makes **you** understand and own the code. The target is not a quicker clone. It is a smaller, demonstrably correct system that you can explain, test, extend, and defend as an AI-engineering and multi-agent project.

Use a coding agent as a reviewer, debugger, test partner, or documentation assistant. Do not ask it to generate an entire feature before you understand the design and write a first attempt yourself.

## What the existing system is

The current system is an agentic bibliometric-analysis web application:

```text
BibTeX upload or literature search
        |
        v
FastAPI API + PostgreSQL session storage
        |
        v
BibTeX parser / data-acquisition MCP tools
        |
        v
LangGraph workflow
  Coordinator -> selected specialists -> synthesis -> recommendations -> PDF
        |
        v
Events, JSON analysis results, chat history, PDF stored in Postgres
        |
        v
Next.js dashboard, progress page, results visualisations, grounded chat
```

### Existing implementation decisions worth preserving

- A user provides a corpus and a research goal; the goal determines which analysis specialists run.
- The coordinator selects only from an allow-listed set of specialists. It does not invent tools or graph paths.
- Specialist order is deterministic: bibliometric analysis, science mapping, then text mining. The final insight and recommendation stages run only after at least one specialist has run.
- MCP servers expose analysis capabilities through tool discovery and invocation, rather than hard-wiring every tool into an agent.
- Structured progress events are first-class data. They make the live UI possible and make routing decisions auditable.
- The LLM is constrained to structured outputs for routing, gap analysis, and recommendations; deterministic code calculates the underlying metrics.
- BibTeX parsing is tolerant: malformed entries are skipped and reported rather than crashing a whole run.
- The final chat is read-only over stored results; it should not silently rerun tools or analyses.

### Existing implementation risks to learn from

- The application grew from an MVP into a broad system (upload, acquisition search, three specialists, report, chat, full dashboard). Rebuilding all of that at once will hide the important ideas.
- A FastAPI in-process background task is adequate for a prototype, but not a durable production job queue. A server restart can interrupt work.
- LLM output is not evidence. Metrics, source record IDs, and policy constraints must be validated in code before presentation.
- Storing raw BibTeX, result JSON, and PDFs directly in Postgres is simple for a prototype but needs retention limits and object storage at scale.
- “Multi-agent” should not mean agents converse freely. Most value here comes from a controlled workflow, typed contracts, tool boundaries, and observable state.

## Scope for the new system

### MVP success statement

Given a small BibTeX file and a research goal, the system parses the corpus, chooses one or more relevant deterministic analysis modules, produces saved structured results, and shows an event timeline that proves why each module did or did not run.

Do **not** include paper-search acquisition, PDF generation, semantic embeddings, or chat in the first MVP. Add them only after the core loop is reliable.

### Recommended new repository shape

```text
biblionova-next/
  docs/                 # architecture decision records, API and data contracts
  backend/
    app/                # FastAPI routes, database, services
    domain/             # pure models and analysis logic
    tools/              # local tool interfaces; MCP adapters added later
    orchestration/      # workflow state, router, event publisher
    tests/
  frontend/             # small Next.js UI once API behaviour is stable
  fixtures/             # tiny, valid, malformed, and duplicate BibTeX inputs
  compose.yaml
  README.md
```

Keep pure bibliometric calculations in `domain/`, independent of FastAPI, LangGraph, MCP, and an LLM. That separation is the fastest route to real understanding and fast tests.

## Learning rules

1. Before each feature, write a one-page note: problem, input/output contract, failure cases, and how it will be tested.
2. Implement the smallest working version yourself. It may be ugly initially; do not copy a large generated solution.
3. Write or update a failing test before asking an agent for help with a bug.
4. Ask agents narrow questions: “review this schema,” “explain this traceback,” “suggest edge cases,” or “compare two designs.” Inspect and explain every suggested change before accepting it.
5. Commit each verified vertical slice with a message that names the behaviour, not the technology.
6. Maintain `docs/decisions/` as short Architecture Decision Records (ADRs). Record why a design was chosen and what trade-off it makes.

### Productive uses of a coding agent

- Explain unfamiliar code line by line after you have tried it.
- Review a pull request for correctness, security, accessibility, and test gaps.
- Generate test cases from an already agreed API contract.
- Help interpret logs, stack traces, and performance measurements.
- Challenge an architecture decision with alternatives and trade-offs.

### Uses to avoid

- “Build the whole backend/frontend/multi-agent system.”
- Accepting code you cannot explain in a short walkthrough.
- Letting an LLM decide factual metrics, database state, access control, or whether a run succeeded.
- Replacing tests with a polished demo.

## Staged implementation roadmap

Each stage ends only when its exit criteria pass. The suggested timing assumes 8–12 focused hours per week; extend a stage rather than rushing past its exit gate.

### Stage 0 — Foundations and a system map (Week 1)

**Learn:** Git workflow, Python project layout, HTTP basics, virtual environments, SQL fundamentals, typed data models, and test-driven development.

**Build yourself:**

- Create a fresh repository; do not copy this repository's implementation.
- Write a README with the MVP success statement and a non-goals list.
- Set up Python 3.11+, `uv`, Ruff, Pytest, and a minimal FastAPI `/health` endpoint.
- Create `fixtures/` containing: one valid mini corpus, one duplicate-key corpus, and one malformed-entry corpus.
- Add the first ADR: “Why deterministic analysis precedes LLM orchestration.”

**Exit criteria:** `pytest`, linting, and a health request pass from a clean checkout. You can explain request/response flow and why each development dependency exists.

### Stage 1 — Deterministic BibTeX ingestion (Weeks 2–3)

**Learn:** parsing, validation, data normalization, Pydantic models, error handling, unit tests, and property-based thinking.

**Build yourself:**

- Define a `PaperRecord` contract: id, title, authors, venue, year, abstract, keywords, citation count, and optional references.
- Parse a BibTeX upload into records and a structured skip list.
- Handle invalid UTF-8, unsupported file types, missing required fields, invalid years, and duplicate citation keys.
- Calculate corpus statistics without any LLM: record count, year range, author count, venue count, and skip count.
- Expose `POST /sessions` returning the parsed stats.

**Tests:** unit tests for every bad fixture; API test for upload; regression test for a previously broken input.

**Exit criteria:** a malformed entry never destroys valid entries. A user can see exactly what was skipped and why.

### Stage 2 — Persistence and session lifecycle (Weeks 3–4)

**Learn:** relational data modelling, SQLAlchemy, migrations, transactions, idempotency, and API design.

**Build yourself:**

- Run PostgreSQL with Compose.
- Model `analysis_sessions`, `analysis_results`, and `agent_events` only. Add reports and chat later.
- Define an explicit status machine: `uploaded -> running -> completed | failed | needs_clarification`.
- Add session list, detail, rename, and delete endpoints.
- Write an ADR for JSON result storage versus normalized tables.

**Tests:** migration test against an empty database; lifecycle transition tests; 404 and invalid-transition tests.

**Exit criteria:** data survives a server restart, invalid transitions are rejected, and you can inspect one session plus its events directly in SQL.

### Stage 3 — One analysis module, no agents yet (Weeks 4–5)

**Learn:** separation of domain logic from transport, algorithmic complexity, reproducibility, and result schemas.

**Build yourself:**

- Implement `publication_trend(records)` as a pure function.
- Add one additional pure calculation, such as top authors or citation totals.
- Create versioned result schemas with a `schema_version` field.
- Add `POST /sessions/{id}/analyze` that runs this one module synchronously at first and stores the result.

**Tests:** known-input/known-output unit tests plus one end-to-end upload-to-result test.

**Exit criteria:** results are deterministic and explainable without an LLM, and the API only serializes domain results rather than calculating them.

### Stage 4 — Controlled orchestration and observability (Weeks 5–6)

**Learn:** state machines, dependency injection, async work, structured logging, event-driven UI design, and failure isolation.

**Build yourself:**

- Introduce a small typed workflow state: session ID, goal, records, chosen modules, results, and error state.
- Make routing deterministic first: keyword/rule-based selection of `bibliometric`, `mapping`, and `text_mining` capabilities.
- Emit and persist `module_started`, `module_skipped`, `tool_called`, `module_completed`, and `run_failed` events.
- Move analysis into an asynchronous task only after the synchronous flow is verified.
- Create a polling endpoint for events. WebSockets can wait.

**Tests:** assert the exact sequence of events for: one module, all modules, no matching request, and a failing module.

**Exit criteria:** you can replay a run from stored events and answer: what ran, why it ran, what did not run, and where it failed.

### Stage 5 — Add an LLM router safely (Weeks 6–7)

**Learn:** prompt contracts, structured generation, evaluation fixtures, retries, validation, model cost/latency, and prompt-injection boundaries.

**Build yourself:**

- Preserve deterministic routing as a baseline and fallback.
- Define a strict `RoutingDecision` schema with allow-listed module names, skip reasons, confidence, and a clarification field.
- Keep prompts in versioned files and record the model ID, prompt version, latency, and token usage per run.
- Validate model output in code: remove unknown modules; require at least one valid selection or return clarification; never let model text become executable instructions.
- Create an offline routing evaluation set of 20–30 goals with expected module selections.

**Tests/evaluation:** run the fixture set on every prompt/model change; report precision/recall by module and clarification accuracy. Use a fake LLM in normal unit tests.

**Exit criteria:** the LLM demonstrably improves routing versus the rule baseline, or you retain deterministic routing and document why. You can quantify, not merely claim, the improvement.

### Stage 6 — MCP as a real tool boundary (Weeks 7–8)

**Learn:** Model Context Protocol concepts, stdio transport, tool schemas, discovery, timeouts, and process lifecycle management.

**Build yourself:**

- First define a local Python tool interface and test it thoroughly.
- Extract just one capability (for example, publication trends) into a minimal MCP server with one tool.
- Implement `tools/list` discovery and `tools/call`; log discovery and invocation events.
- Set a timeout, validate tool inputs/outputs, and treat a crashed server as a contained failed run.
- Only then add a second server for keyword co-occurrence.

**Tests:** server function tests, discovery test, malformed tool-output test, timeout test, and one real local stdio integration test.

**Exit criteria:** adding a tool changes server code and its tests, but does not require modifying coordinator routing code. You can explain why MCP is useful here and when it is unnecessary overhead.

### Stage 7 — Specialist modules and evidence discipline (Weeks 8–10)

**Learn:** network analysis, embeddings/clustering, evidence grounding, provenance, and statistical limitations.

**Build yourself in this order:**

1. Bibliometric trends, citations, authors, and venues.
2. Keyword co-occurrence network with explicit minimum-frequency settings.
3. Text clustering only when records contain enough title/abstract text; store model name, parameters, random seed, and corpus size.
4. Insight synthesis that can cite specific metric fields and record IDs.

Use the LLM to explain grounded results, never to manufacture counts, network edges, or record IDs. If evidence is insufficient, return “unknown” explicitly.

**Exit criteria:** every dashboard claim can be traced to a stored metric or source record. Sparse or missing fields produce an honest limitation, not a confident invention.

### Stage 8 — Minimal frontend (Weeks 10–11)

**Learn:** TypeScript, React state, accessible forms, API clients, data visualisation, and frontend error states.

**Build yourself:**

- Start with three screens only: upload/goal, run timeline, and results.
- Render backend event data; do not fake agent states once connected to a real API.
- Show routing decision, selected/skipped modules, corpus warnings, one trend chart, and one raw-result inspector.
- Include loading, empty, failed, and clarification states before adding visual polish.

**Tests:** component tests for state rendering; browser-level test for upload -> run -> results; keyboard-only check for the primary flow.

**Exit criteria:** a person can verify the selective-routing thesis from the UI without reading logs or source code.

### Stage 9 — Optional product features (Week 12 onward)

Add one at a time, each behind a feature flag and test suite:

- PDF report generation with explicit provenance notes.
- Read-only, grounded chat over completed stored results.
- Literature acquisition from OpenAlex/arXiv with source labels, rate limits, deduplication, and user review before analysis.
- WebSockets for live events.
- A durable job queue and object storage for production-scale processing.

## Multi-agent architecture to aim for

Start with **workflow orchestration**, not autonomous collaboration:

```text
User goal + corpus stats
        |
        v
Router (LLM with schema + deterministic validation)
        |
        +--> bibliometric tool ----+
        +--> mapping tool ---------+--> evidence validator --> synthesis
        +--> text-mining tool -----+              |                |
                                                events          saved result
```

Design principles:

- One coordinator owns routing; specialists do not negotiate among themselves.
- Each specialist has a narrow input/output schema and no direct database access.
- Tools return data; LLMs summarize and make bounded classifications.
- A validator checks citations/record IDs, schema validity, and allowed claims before a synthesis is saved.
- All model, tool, and routing activity is observable through immutable events.
- Introduce parallel execution only after sequential behaviour and failure handling are proven.

## Definition of done for the learning rebuild

The rebuild is ready for a demo or thesis chapter when you can:

- Draw the request-to-result path from memory and explain every boundary.
- Run all tests from a clean checkout using documented commands.
- Demonstrate three goals that activate different module subsets, plus one clarification case.
- Show persisted events and prove why an agent/tool did or did not run.
- Trace a reported research gap back to a stored metric and source records.
- Replace the LLM with a fake in tests without breaking core analysis.
- Explain one known limitation for every ML/LLM result shown to users.

## Suggested weekly reflection

At the end of each week, answer these in `docs/learning-log.md`:

1. What did I build without an agent writing it for me?
2. Which boundary (API, DB, tool, workflow, model, UI) do I now understand better?
3. Which test gave me the most confidence, and what failure would still escape it?
4. What did the LLM decide, and what did deterministic code verify?
5. What one concept will I rebuild from memory next week?

