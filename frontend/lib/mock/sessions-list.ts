import type { AgentName, SessionStatusValue } from "@/lib/types";

export interface MockSessionListItem {
  id: string;
  name: string;
  filename: string;
  goal: string;
  activated: AgentName[];
  status: SessionStatusValue;
  created_at: string;
}

export const MOCK_SESSIONS_LIST: MockSessionListItem[] = [
  {
    id: "demo-session",
    name: "Agentic AI in Healthcare — Gap Analysis",
    filename: "wos_export_agentic_ai_llm.bib",
    goal: "Identify research gaps in agentic AI applications for healthcare between 2015 and 2026, and map how the field's publication trends and thematic structure have evolved.",
    activated: ["bibliometric_analyst", "science_mapping"],
    status: "completed",
    created_at: "2026-07-18T09:14:00Z",
  },
  {
    id: "session-education-2",
    name: "LLM Agents in Education — Trend Scan",
    filename: "wos_export_edu_llm_agents.bib",
    goal: "Show me publication and citation trends for LLM-based tutoring agents.",
    activated: ["bibliometric_analyst"],
    status: "completed",
    created_at: "2026-07-15T14:02:00Z",
  },
  {
    id: "session-semantic-3",
    name: "Emerging Themes in Multi-Agent Systems",
    filename: "wos_export_multiagent_2026.bib",
    goal: "What semantic themes are emerging in multi-agent systems research that I might be missing?",
    activated: ["science_mapping", "text_mining"],
    status: "completed",
    created_at: "2026-07-10T11:47:00Z",
  },
  {
    id: "session-running-4",
    name: "Tool-Augmented Reasoning Corpus",
    filename: "wos_export_tool_augmented.bib",
    goal: "Full picture: trends, keyword networks, and semantic clusters for tool-augmented reasoning research.",
    activated: ["bibliometric_analyst", "science_mapping", "text_mining"],
    status: "running",
    created_at: "2026-07-20T02:05:00Z",
  },
  {
    id: "session-failed-5",
    name: "Malformed Export Retry",
    filename: "wos_export_corrupted.bib",
    goal: "Identify citation trends in this corpus.",
    activated: [],
    status: "failed",
    created_at: "2026-07-09T08:30:00Z",
  },
];
