import type { AgentEvent, AnalysisResult, SessionDetail } from "@/lib/types";
import {
  MOCK_SESSION_ID,
  MOCK_FILENAME,
  MOCK_GOAL,
  MOCK_CORPUS_STATS,
  MOCK_ROUTING_DECISION,
  MOCK_EXECUTIVE_SUMMARY,
} from "@/lib/mock/corpus";
import { MOCK_BIBLIOMETRIC_RESULT } from "@/lib/mock/bibliometric";
import { MOCK_SCIENCE_MAPPING_RESULT } from "@/lib/mock/network";
import { MOCK_TEXT_MINING_RESULT } from "@/lib/mock/clusters";
import { MOCK_INSIGHTS_RESULT, MOCK_RESEARCH_ADVISOR_RESULT } from "@/lib/mock/gaps";
import { MOCK_PROGRESS_TIMELINE } from "@/lib/mock/progress-timeline";

export * from "@/lib/mock/corpus";
export * from "@/lib/mock/bibliometric";
export * from "@/lib/mock/network";
export * from "@/lib/mock/clusters";
export * from "@/lib/mock/gaps";
export * from "@/lib/mock/progress-timeline";
export * from "@/lib/mock/chat";
export * from "@/lib/mock/sessions-list";

export const MOCK_SESSION_DETAIL: SessionDetail = {
  id: MOCK_SESSION_ID,
  name: "Agentic AI in Healthcare — Gap Analysis",
  filename: MOCK_FILENAME,
  goal: MOCK_GOAL,
  status: "completed",
  corpus_stats: MOCK_CORPUS_STATS,
  routing_decision: MOCK_ROUTING_DECISION,
  executive_summary: MOCK_EXECUTIVE_SUMMARY,
  error_message: null,
  created_at: "2026-07-18T09:14:00Z",
  updated_at: "2026-07-18T09:15:12Z",
};

export const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [
  {
    agent_name: "bibliometric_analyst",
    result_json: MOCK_BIBLIOMETRIC_RESULT,
    created_at: "2026-07-18T09:14:40Z",
  },
  {
    agent_name: "science_mapping",
    result_json: MOCK_SCIENCE_MAPPING_RESULT,
    created_at: "2026-07-18T09:14:52Z",
  },
  {
    agent_name: "insights_reporting",
    result_json: MOCK_INSIGHTS_RESULT,
    created_at: "2026-07-18T09:15:05Z",
  },
  {
    agent_name: "research_advisor",
    result_json: MOCK_RESEARCH_ADVISOR_RESULT,
    created_at: "2026-07-18T09:15:12Z",
  },
];

// Not wired into the default (completed) demo session — Text Mining was
// skipped there — but kept fully populated for reuse (e.g. sessions where
// all three specialists were activated).
export { MOCK_TEXT_MINING_RESULT };

const baseTime = new Date(MOCK_SESSION_DETAIL.created_at).getTime();
export const MOCK_AGENT_EVENTS: AgentEvent[] = MOCK_PROGRESS_TIMELINE.filter(
  (step) => step.event
).map((step) => ({
  ...step.event!,
  created_at: new Date(baseTime + step.atMs).toISOString(),
}));
