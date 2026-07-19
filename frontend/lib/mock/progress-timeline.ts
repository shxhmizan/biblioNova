import type { AgentEventType, AgentName } from "@/lib/types";
import { MOCK_ROUTING_DECISION } from "@/lib/mock/corpus";

export interface ProgressStep {
  atMs: number;
  reasoningLine?: string;
  event?: {
    event_type: AgentEventType;
    agent_name: AgentName | null;
    payload: Record<string, unknown>;
  };
}

const skip = MOCK_ROUTING_DECISION.skipped[0];

export const MOCK_PROGRESS_TIMELINE: ProgressStep[] = [
  { atMs: 0, event: { event_type: "agent_started", agent_name: "coordinator", payload: {} } },
  {
    atMs: 300,
    reasoningLine: "Parsing goal against corpus of 1,247 records spanning 2015-2026...",
  },
  {
    atMs: 800,
    reasoningLine:
      "Goal concerns publication trends and thematic structure — activating Bibliometric Analyst and Science Mapping.",
  },
  {
    atMs: 1100,
    event: {
      event_type: "agent_completed",
      agent_name: "coordinator",
      payload: {
        activated: MOCK_ROUTING_DECISION.activated,
        justification: MOCK_ROUTING_DECISION.justification,
      },
    },
  },
  {
    atMs: 1150,
    event: {
      event_type: "agent_skipped",
      agent_name: "text_mining",
      payload: { reason: skip.reason },
    },
  },
  {
    atMs: 1250,
    event: { event_type: "agent_started", agent_name: "bibliometric_analyst", payload: {} },
  },
  {
    atMs: 1450,
    event: {
      event_type: "tool_discovered",
      agent_name: "bibliometric_analyst",
      payload: { tools: ["publication_trend", "citation_analysis"] },
    },
  },
  {
    atMs: 2050,
    event: {
      event_type: "tool_called",
      agent_name: "bibliometric_analyst",
      payload: { tool: "publication_trend", duration_seconds: 0.6 },
    },
  },
  {
    atMs: 2850,
    event: {
      event_type: "tool_called",
      agent_name: "bibliometric_analyst",
      payload: { tool: "citation_analysis", duration_seconds: 0.9 },
    },
  },
  {
    atMs: 3150,
    event: {
      event_type: "agent_completed",
      agent_name: "bibliometric_analyst",
      payload: { total_publications: 1247 },
    },
  },
  {
    atMs: 3250,
    event: { event_type: "agent_started", agent_name: "science_mapping", payload: {} },
  },
  {
    atMs: 3450,
    event: {
      event_type: "tool_discovered",
      agent_name: "science_mapping",
      payload: { tools: ["co_occurrence_analysis", "cocitation_analysis"] },
    },
  },
  {
    atMs: 4250,
    event: {
      event_type: "tool_called",
      agent_name: "science_mapping",
      payload: { tool: "co_occurrence_analysis", duration_seconds: 1.1 },
    },
  },
  {
    atMs: 5150,
    event: {
      event_type: "tool_called",
      agent_name: "science_mapping",
      payload: { tool: "cocitation_analysis", duration_seconds: 0.7 },
    },
  },
  {
    atMs: 5450,
    event: {
      event_type: "agent_completed",
      agent_name: "science_mapping",
      payload: { clusters: 4 },
    },
  },
  {
    atMs: 5550,
    event: { event_type: "agent_started", agent_name: "insights_reporting", payload: {} },
  },
  {
    atMs: 6800,
    event: {
      event_type: "agent_completed",
      agent_name: "insights_reporting",
      payload: { gap_count: 4 },
    },
  },
  {
    atMs: 6900,
    event: { event_type: "agent_started", agent_name: "research_advisor", payload: {} },
  },
  {
    atMs: 7900,
    event: {
      event_type: "agent_completed",
      agent_name: "research_advisor",
      payload: { recommendation_count: 4 },
    },
  },
];

export const MOCK_TIMELINE_TOTAL_MS = 8200;
