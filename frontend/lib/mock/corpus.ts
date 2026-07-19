import type { CorpusStats, RoutingDecision } from "@/lib/types";

export const MOCK_SESSION_ID = "demo-session";
export const MOCK_FILENAME = "wos_export_agentic_ai_llm.bib";
export const MOCK_GOAL =
  "Identify research gaps in agentic AI applications for healthcare between 2015 and 2026, and map how the field's publication trends and thematic structure have evolved.";

export const MOCK_CORPUS_STATS: CorpusStats = {
  record_count: 1247,
  valid_count: 1247,
  skipped_count: 8,
  year_min: 2015,
  year_max: 2026,
  unique_authors: 612,
  unique_journals: 34,
  skipped: [
    { key: "kwan2021prelim", reason: "missing required field(s): year" },
    { key: "duplicate-entry-4471", reason: "duplicate citation key: chen2022agentic" },
    { key: null, reason: "unparseable entry: unbalanced braces near line 8842" },
    { key: "no-author-2019", reason: "missing required field(s): author" },
    { key: "field-report-1990s", reason: "invalid or non-numeric year" },
    { key: "conf-abstract-only", reason: "missing required field(s): journal, year" },
    { key: "duplicate-entry-9021", reason: "duplicate citation key: park2023llm" },
    { key: null, reason: "unparseable entry: unbalanced braces near line 15230" },
  ],
};

export const MOCK_ROUTING_DECISION: RoutingDecision = {
  activated: ["bibliometric_analyst", "science_mapping"],
  skipped: [
    {
      agent: "text_mining",
      reason:
        "The goal asks about publication trends and thematic structure, both covered by Bibliometric Analyst and Science Mapping — it does not ask for open-ended semantic theme discovery across abstracts.",
    },
  ],
  justification:
    "The goal centers on publication trends over time and how the field's thematic structure has evolved, which Bibliometric Analyst and Science Mapping directly address. Text Mining's semantic clustering isn't required since the goal doesn't ask for latent theme discovery beyond known thematic structure.",
};

export const MOCK_EXECUTIVE_SUMMARY =
  "Across 1,247 records spanning 2015–2026, publications on agentic AI grew from 14 in 2015 to a peak of 268 in 2024, with citation activity concentrated in 2019–2023 work. Science mapping reveals four dominant thematic clusters — agentic planning, tool use and protocols, healthcare applications, and evaluation/benchmarking — with dense co-occurrence within clusters but sparse bridges between them. Healthcare-specific agentic AI remains comparatively underexplored relative to general-purpose agent research, particularly for long-horizon clinical decision support and multi-agent care coordination, and evaluation methodology for agentic systems in high-stakes domains lags behind capability development.";
