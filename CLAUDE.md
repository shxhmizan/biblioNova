# BiblioAgent — FYP Prototype

*Final Year Project (UiTM): "Agentic AI System with Model Context Protocol (MCP)-Based Integration for Automated Bibliometric Analysis."*

## What the system does

A user uploads a BibTeX dataset (exported from Web of Science) and states a research goal in natural language. A Coordinator agent interprets the goal and **selectively activates** specialist agents. The agents perform analysis by calling tools on MCP servers, and the system outputs interactive visualizations, identified research gaps, future research topic recommendations, and a downloadable PDF report. Session history is persisted.

The core thesis claim the prototype must demonstrate: **execution paths adapt to user intent** (different goals → different agents activated → different analyses run), unlike fixed-pipeline tools like VOSviewer. Every architectural decision should protect and showcase this.

## Architecture (4 layers — do not deviate without asking)

1. **Presentation layer** — Next.js 14+ (App Router, TypeScript, Tailwind, shadcn/ui). Upload, goal input, live agent progress view, results dashboard, grounded chatbot drawer, session history. (Full spec in "Phase 4 — Frontend Specification" below; the frontend is built in Phase 4.)
2. **Multi-agent orchestration layer** — LangGraph (Python) with OpenRouter as the LLM provider. Six agents:
   - **Coordinator** — parses the research goal, decides which specialists to activate and in what order, produces the executive summary; also powers the results chatbot.
   - **Bibliometric Analyst** — publication trends, citation analysis, author/journal rankings.
   - **Science Mapping** — keyword co-occurrence and co-citation networks.
   - **Text Mining** — semantic clustering: `sentence-transformers/all-MiniLM-L6-v2` embeddings + Gaussian Mixture Models, auto-labeled clusters.
   - **Insights & Reporting** — synthesizes specialist outputs, identifies research gaps with supporting evidence, generates the PDF report.
   - **Research Advisor** — proposes future research topics mapped to identified gaps.
3. **MCP server layer** — three Python MCP servers using the official `mcp` SDK, stdio transport, spawned by the backend. Agents must use genuine `tools/list` discovery then `tools/call` execution (via `langchain-mcp-adapters`) — no hardcoded tool bindings, because "add a tool with zero agent-code changes" is a claim defended in the thesis:
   - `bibtex-parser-server`: `parse_bibtex()`, `extract_metadata()`
   - `bibliometric-analysis-server`: `citation_analysis()`, `publication_trend()`
   - `science-mapping-server`: `co_occurrence_analysis()`, `cocitation_analysis()`
4. **Analysis & storage layer** — FastAPI backend, PostgreSQL (SQLAlchemy + Alembic). Stores structured JSON results, embeddings, generated visualizations (Matplotlib for report figures; frontend renders its own interactive charts from JSON), PDF reports, and session metadata (filename, goal, agents activated, timestamps).

## System flow (locked — implement exactly this)

1. **Upload & parse (synchronous):** user uploads `.bib` + research goal → backend immediately calls the `bibtex-parser-server` MCP tools to parse, validate, and extract corpus stats (record count, year range, dedupe/skip counts). Stats are returned to the frontend for instant feedback and stored on the session. Malformed entries are logged and skipped, never fatal.
2. **Coordinator routing:** Coordinator receives goal + corpus stats, and via LLM reasoning selects which of the three specialists to activate (Bibliometric Analyst, Science Mapping, Text Mining). It outputs a structured routing decision: `{activated: [...], skipped: [{agent, reason}], justification}`. This decision is persisted — it is thesis evaluation data.
3. **Routing rules are hard-coded in the LangGraph edges; the LLM only chooses the specialist subset:**
   - At least one specialist must be activated; if the goal is unanalyzable, Coordinator returns a clarification error instead of running anything.
   - Insights & Reporting ALWAYS runs when ≥1 specialist ran (the report is a core deliverable).
   - Research Advisor ALWAYS runs after Insights & Reporting (never independently).
   - Specialists are the only conditionally-activated layer.
4. **Specialists run SEQUENTIALLY** (Analyst → Mapping → Text Mining, skipping non-activated ones). No parallel fan-out in the prototype — simpler debugging and a cleaner progress narrative. Note parallelization as future work in code comments only.
5. **Text Mining runs in-process** (sentence-transformers + GMM directly in Python) — it has no MCP server, per the thesis architecture. The other two specialists MUST go through MCP discovery + invocation.
6. **Insights & Reporting** consumes all specialist outputs from the DB, produces gap analysis (each gap: title, evidence with counts, confidence, supporting record IDs) and the PDF report. **Research Advisor** consumes the gap analysis and produces recommendations mapped 1:1 to gaps.
7. **Chat (v1 = read-only):** a separate endpoint where the Coordinator answers questions grounded ONLY in the stored analysis JSON for that session. It never re-runs agents or calls MCP tools. Chat-triggered re-analysis is out of scope.

## Key technical decisions (already made)

- MCP transport: **stdio subprocesses**, one per server, managed by the backend.
- Long-running analysis: FastAPI **background task per session** with a status/event model; frontend polls or subscribes via WebSocket for progress events (agent state changes + MCP tool-call log lines — the progress UI replays these).
- LLM access: **OpenRouter only**, model configurable via env (`OPENROUTER_MODEL`, default a cost-efficient model). API key from `.env`, never committed.
- Every agent/MCP interaction must emit a structured event (`agent_started`, `agent_skipped` with reason, `tool_discovered`, `tool_called` with args + duration, `agent_completed`) persisted per session — these power both the live progress screen and the thesis evaluation chapter.
- Python 3.11+, `uv` for dependency management, `ruff` for lint/format, `pytest` for tests.

## Repository structure

```
biblioagent/
├── CLAUDE.md                  # this brief
├── backend/
│   ├── app/                   # FastAPI: routers, services, models, schemas
│   ├── agents/                # LangGraph graph, coordinator + specialist nodes, prompts/
│   ├── mcp_servers/           # bibtex_parser/, bibliometric_analysis/, science_mapping/
│   ├── tests/
│   └── pyproject.toml
├── frontend/                  # Next.js app (Phase 4)
├── data/samples/              # sample .bib files for dev + demo
└── docker-compose.yml         # postgres for local dev
```

## Build phases (mirror the thesis sprint plan — work in this order, one phase per session unless told otherwise)

- **Phase 1 — Foundation:** repo scaffold, docker-compose Postgres, FastAPI skeleton (health, session CRUD, BibTeX upload + storage), the `bibtex-parser-server` MCP server, a minimal LangGraph graph (Coordinator → Bibliometric Analyst only) proving the full round trip: upload → goal → coordinator routes → agent discovers + calls MCP tools → JSON result persisted. End with an integration test against a sample .bib file.
- **Phase 2 — Analysis agents:** remaining two MCP servers; full Bibliometric Analyst, Science Mapping, and Text Mining agents; selective-activation routing in the Coordinator with skip reasons; structured event stream.
- **Phase 3 — Intelligence layer:** Insights & Reporting agent (gap identification + PDF report via reportlab/weasyprint), Research Advisor agent, results chatbot endpoint grounded in stored analysis JSON.
- **Phase 4 — Frontend & integration:** implement the UI per the "Phase 4 — Frontend Specification" section below, wire to the real API, WebSocket progress, end-to-end testing with the sample corpus.

## Working rules

1. Before writing code in each session, restate the phase goal and list the files you plan to create/modify. Wait for confirmation if the plan diverges from this brief.
2. Small, runnable increments — after each meaningful step, state the exact command to verify it works.
3. Ask, don't assume, when the thesis spec is ambiguous. Never silently rename agents, tools, or layers — the naming must match the thesis document.
4. Write tests for MCP tool functions and the coordinator's routing decisions (routing is the evaluation metric — it must be testable with fixed fixtures).
5. Handle real-world BibTeX mess: malformed entries, missing fields, duplicate keys. Log and skip bad records with counts, never crash the pipeline.
6. Keep every LLM prompt in `agents/prompts/` as versioned files, not inline strings — these are iterated on constantly (Evolutionary Prototyping methodology).
7. Commit after each working increment with conventional commit messages.

---

# Phase 4 — Frontend Specification

Build the complete frontend for **BiblioAgent** — an Agentic AI web application that automates bibliometric analysis. Users upload a BibTeX dataset (exported from Web of Science), state a research goal in natural language, and a multi-agent AI system (Coordinator + 5 specialist agents communicating with analysis tools via the Model Context Protocol) produces visualizations, identified research gaps, future topic recommendations, and a downloadable PDF report.

## Tech stack

- Next.js 14+ (App Router), TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for statistical charts, react-force-graph (or d3-force) for network graphs
- lucide-react icons
- Zustand or React context for client state
- Build UI first against realistic mock fixtures (see Mock Data section), with every API interaction isolated in `lib/api.ts`; then swap the mock implementations for real FastAPI + WebSocket calls as the final step of Phase 4
- Dark mode default with light mode toggle

## Design direction

Academic research tool aesthetic: calm, precise, data-dense but never cluttered. Deep navy/slate base, one accent color (electric indigo) used sparingly for agent activity and primary actions, plus a small categorical palette for charts. Inter or Geist for UI text, JetBrains Mono for metadata/tool-call logs. Generous whitespace, 1px borders over shadows, subtle motion only where it communicates system activity (agent status transitions, streaming progress). It should feel like a serious instrument, not a marketing site. Avoid generic SaaS gradients.

## Global layout

Persistent left sidebar (collapsible on mobile):
- Logo/wordmark "BiblioAgent"
- Nav: New Analysis, Sessions, About
- Bottom: theme toggle, user placeholder

Top bar on content pages: breadcrumb, session name (editable inline), status badge.

## Pages & components

### 1. Landing page `/`
- Concise hero: headline, one-sentence value prop, "Start Analysis" CTA
- Three-step "how it works" strip: Upload BibTeX → State your goal → Agents analyze
- A small architecture teaser: horizontal diagram of Coordinator → specialist agents → MCP servers (static, decorative)
- Footer: "Final Year Project — Universiti Teknologi MARA"

### 2. New Analysis `/analyze`
Two-panel setup screen:
- **Left — Dataset upload:** drag-and-drop zone accepting `.bib` files. On mock upload, show file card with parsed stats (filename, size, 1,247 records detected, year range 2015–2026, source: Web of Science). Validation error state for wrong file type. Option to load a bundled sample dataset ("Try with sample: LLM research corpus").
- **Right — Research goal:** large textarea with placeholder "e.g. Identify research gaps in agentic AI applications for healthcare between 2020 and 2026". Below it, 3 clickable example goal chips. Character counter, min 20 chars.
- Sticky bottom bar: "Run Analysis" primary button (disabled until both inputs valid).

### 3. Analysis Progress `/analyze/[id]/progress`
This is the signature screen — it must visibly demonstrate **selective agent activation** (the system's core differentiator vs. fixed-pipeline tools like VOSviewer).

- **Coordinator decision card** at top: shows the user's goal, then a streamed "reasoning summary" line, then which agents the Coordinator activated and which it skipped, with a one-line justification each.
- **Agent pipeline visualization:** 6 agent cards in a flow layout — Coordinator, Bibliometric Analyst, Science Mapping, Text Mining, Insights & Reporting, Research Advisor. States: `queued` (dimmed), `active` (accent pulse + spinner), `done` (check + duration), `skipped` (grayed with "not required for this goal" tooltip). Animate transitions as the mock run progresses.
- **MCP activity log panel** (collapsible, monospace): streaming lines like
  `[science-mapping-server] tools/list → 2 tools discovered`
  `[science-mapping-server] tools/call co_occurrence_analysis({min_freq: 5}) → 312 nodes, 1,840 edges (2.4s)`
- Overall progress bar + elapsed time. Cancel button.
- On mock completion (~8s scripted sequence), auto-redirect to results.

### 4. Results Dashboard `/analyze/[id]`
Tabbed or sectioned dashboard. Sections render only for agents that ran (skipped agents' sections show a subtle "Not run for this goal — re-run with broader goal" placeholder).

- **Overview:** stat cards (total publications, total citations, h-index of corpus, active years, top country), plus the Coordinator's executive summary paragraph.
- **Publication Trends** (Bibliometric Analyst): line/area chart of publications per year, bar chart of citations per year, tables of top 10 authors and top 10 journals with counts and citation totals.
- **Science Mapping:** interactive force-directed **keyword co-occurrence network** (node size = frequency, color = cluster, hover tooltip, zoom/pan) and a **co-citation network**. Cluster legend. Fullscreen toggle.
- **Semantic Clusters** (Text Mining): cards for each GMM cluster — auto-generated theme label, top keywords, representative paper titles, cluster size; plus a 2D scatter (UMAP-style mock) of embeddings colored by cluster.
- **Research Gaps** (Insights & Reporting): numbered gap cards, each with title, evidence summary ("only 3 of 1,247 papers address…"), confidence badge (high/medium), and linked supporting papers.
- **Recommendations** (Research Advisor): future topic cards with rationale and suggested methodology, each mapped to the gap it addresses.
- **Report:** preview card of the generated PDF (cover thumbnail, page count) + Download button.

### 5. Chat panel (persistent on results page)
Right-side collapsible drawer: chatbot grounded in the completed analysis. Message bubbles, streaming mock responses, suggested question chips ("Which author dominates cluster 3?", "Summarize gap #2"). Answers cite sections of the analysis with clickable anchors that scroll the dashboard to the referenced chart.

### 6. Sessions `/sessions`
Table/list of past analyses: session name, dataset filename, goal (truncated), agents activated (small avatar row), date, status. Row click opens the results. Empty state illustration for no sessions. Delete with confirm dialog.

## Mock data

Create `lib/mock/` fixtures: one realistic corpus summary (1,247 records, LLM/agentic-AI-themed), per-year trend arrays 2015–2026, 10 authors, 10 journals, a 40-node co-occurrence graph with 4 clusters, 5 GMM clusters with labels, 4 research gaps, 5 recommendations, one scripted 8-second progress timeline (array of timestamped agent/MCP events the progress page replays), and 6 canned chat Q&A pairs. All charts and tables must render fully populated from these fixtures.

## Quality bar

- Fully responsive (sidebar collapses to bottom nav on mobile; network graphs get a simplified mobile fallback)
- Loading skeletons for every data surface; empty and error states designed, not default
- Keyboard accessible, visible focus rings, semantic HTML
- No lorem ipsum anywhere — all copy written for the actual product
- Componentize: AgentCard, McpLogLine, StatCard, GapCard, ClusterCard, NetworkGraph, ChatDrawer must be reusable
