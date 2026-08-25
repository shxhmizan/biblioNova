// Mirrors backend/app/schemas.py and backend/agents/schemas.py exactly —
// keep these two in sync by hand (no shared codegen in this prototype).

export type AgentName =
  | "coordinator"
  | "bibliometric_analyst"
  | "science_mapping"
  | "text_mining"
  | "insights_reporting"
  | "research_advisor"
  | "data_acquisition";

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
  data_acquisition: "Data Acquisition",
};

export type SessionStatusValue =
  | "uploaded"
  | "searching"
  | "awaiting_selection"
  | "running"
  | "completed"
  | "failed"
  | "needs_clarification";

export type AcquisitionMode = "upload" | "agentic_search";

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
  name: string;
  filename: string;
  goal: string;
  status: SessionStatusValue;
  corpus_stats: CorpusStats;
  created_at: string;
}

export interface SessionDetail {
  id: string;
  name: string;
  filename: string;
  goal: string;
  status: SessionStatusValue;
  corpus_stats: CorpusStats;
  acquisition_mode: AcquisitionMode;
  search_query: string | null;
  sources_used: string[] | null;
  results_retrieved: number | null;
  results_selected: number | null;
  routing_decision: RoutingDecision | null;
  executive_summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionListItem {
  id: string;
  name: string;
  filename: string;
  goal: string;
  status: SessionStatusValue;
  routing_decision: RoutingDecision | null;
  created_at: string;
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

export type CollaborationLevel = "author" | "institution" | "country";

export interface CoauthorshipNode {
  id: string;
  label: string;
  paper_count: number;
}

export interface CoauthorshipGraph {
  nodes: CoauthorshipNode[];
  edges: GraphEdge[];
  note?: string;
}

export interface CollaboratingPair {
  a: string;
  b: string;
  shared_papers: number;
}

export interface InternationalCollaborationRate {
  rate_percent: number | null;
  note?: string;
}

export interface CoauthorshipNetworkResult {
  author: CoauthorshipGraph;
  institution: CoauthorshipGraph;
  country: CoauthorshipGraph;
  top_collaborating_pairs: CollaboratingPair[];
  international_collaboration_rate: InternationalCollaborationRate;
}

export interface BibliometricAnalystResult {
  publication_trend?: PublicationTrend;
  citation_analysis?: CitationAnalysis;
  coauthorship_network_analysis?: CoauthorshipNetworkResult;
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
  bibliographic_coupling_analysis?: CocitationAnalysis;
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

// ---- Agentic Search (Data Acquisition) ----

export interface AcquisitionCandidate {
  source: "openalex" | "arxiv";
  source_id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  abstract: string;
  doi: string;
  times_cited: number;
  is_oa: boolean;
  url: string;
  bibtex_key: string;
  bibtex_entry: string;
}

export interface AcquisitionSearchParams {
  query: string;
  year_from?: number;
  year_to?: number;
  max_results?: number;
}

export interface AcquisitionSearchResult {
  id: string;
  status: "awaiting_selection" | "needs_clarification";
  message: string | null;
  sources_used: string[];
  results_retrieved: number;
  candidates: AcquisitionCandidate[];
}

// ---- Progress-page UI state (client-derived, not a backend shape) ----

export type AgentUiState = "queued" | "active" | "done" | "skipped";
