// Mirrors backend/app/schemas.py and backend/agents/schemas.py exactly —
// keep these two in sync by hand (no shared codegen in this prototype).

export type AgentName =
  | "coordinator"
  | "bibliometric_analyst"
  | "science_mapping"
  | "text_mining"
  | "insights_reporting"
  | "research_advisor";

export const SPECIALIST_AGENTS: AgentName[] = [
  "bibliometric_analyst",
  "science_mapping",
  "text_mining",
];

export const PIPELINE_AGENTS: AgentName[] = [
  "coordinator",
  "bibliometric_analyst",
  "science_mapping",
  "text_mining",
  "insights_reporting",
  "research_advisor",
];

export const AGENT_LABELS: Record<AgentName, string> = {
  coordinator: "Coordinator",
  bibliometric_analyst: "Bibliometric Analyst",
  science_mapping: "Science Mapping",
  text_mining: "Text Mining",
  insights_reporting: "Insights & Reporting",
  research_advisor: "Research Advisor",
};

export type SessionStatusValue =
  | "uploaded"
  | "running"
  | "completed"
  | "failed"
  | "needs_clarification";

export interface SkippedRecord {
  key: string | null;
  reason: string;
}

export interface CorpusStats {
  record_count: number;
  valid_count: number;
  skipped_count: number;
  year_min: number | null;
  year_max: number | null;
  unique_authors: number;
  unique_journals: number;
  skipped: SkippedRecord[];
}

export interface SpecialistSkip {
  agent: string;
  reason: string;
}

export interface RoutingDecision {
  activated: string[];
  skipped: SpecialistSkip[];
  justification: string;
  clarification_needed: boolean;
  clarification_message: string | null;
}

export interface SessionSummary {
  id: string;
  filename: string;
  goal: string;
  status: SessionStatusValue;
  corpus_stats: CorpusStats;
  created_at: string;
}

export interface SessionDetail {
  id: string;
  filename: string;
  goal: string;
  status: SessionStatusValue;
  corpus_stats: CorpusStats;
  routing_decision: RoutingDecision | null;
  executive_summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type AgentEventType =
  | "agent_started"
  | "agent_skipped"
  | "tool_discovered"
  | "tool_called"
  | "agent_completed";

export interface AgentEvent {
  event_type: AgentEventType;
  agent_name: AgentName | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// ---- Specialist / intelligence-layer result shapes ----

export interface PublicationTrend {
  years: number[];
  publications_per_year: number[];
  citations_per_year: number[];
  total_publications: number;
  total_citations: number;
  year_range: [number, number] | null;
}

export interface CitationAnalysis {
  total_publications: number;
  total_citations: number;
  average_citations_per_paper: number;
  most_cited_papers: { id: string; title: string; year: number; times_cited: number }[];
  top_authors: { author: string; total_citations: number; publication_count: number }[];
  top_journals: { journal: string; total_citations: number; publication_count: number }[];
}

export interface BibliometricAnalystResult {
  publication_trend?: PublicationTrend;
  citation_analysis?: CitationAnalysis;
}

export interface CoOccurrenceNode {
  id: string;
  label: string;
  frequency: number;
  cluster: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface CoOccurrenceAnalysis {
  nodes: CoOccurrenceNode[];
  edges: GraphEdge[];
  clusters: number;
}

export interface CocitationNode {
  id: string;
  title: string;
  times_cited: number;
}

export interface CocitationAnalysis {
  nodes: CocitationNode[];
  edges: GraphEdge[];
  note?: string;
}

export interface ScienceMappingResult {
  co_occurrence_analysis?: CoOccurrenceAnalysis;
  cocitation_analysis?: CocitationAnalysis;
}

export interface SemanticCluster {
  cluster_id: number;
  label: string;
  size: number;
  top_keywords: string[];
  representative_titles: string[];
  record_ids: string[];
}

export interface TextMiningResult {
  n_clusters: number;
  clusters: SemanticCluster[];
}

export type GapConfidence = "high" | "medium";

export interface Gap {
  id: string;
  title: string;
  evidence: string;
  confidence: GapConfidence;
  supporting_record_ids: string[];
}

export interface InsightsReportingResult {
  gaps: Gap[];
  executive_summary: string;
}

export interface Recommendation {
  addresses_gap_id: string;
  topic: string;
  rationale: string;
  suggested_methodology: string;
}

export interface ResearchAdvisorResult {
  recommendations: Recommendation[];
}

export interface AnalysisResult {
  agent_name: AgentName;
  result_json:
    | BibliometricAnalystResult
    | ScienceMappingResult
    | TextMiningResult
    | InsightsReportingResult
    | ResearchAdvisorResult;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ---- Progress-page UI state (client-derived, not a backend shape) ----

export type AgentUiState = "queued" | "active" | "done" | "skipped";
