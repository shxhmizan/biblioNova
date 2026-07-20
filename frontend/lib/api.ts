/**
 * Every API interaction is isolated here, per the build methodology: the UI
 * was built first against `lib/mock/*` fixtures, then wired to the real
 * FastAPI backend as the final step of Phase 4. Both implementations satisfy
 * the same `Api` interface, selected by NEXT_PUBLIC_API_MODE, so no page or
 * component needs to know or care which one is active.
 *
 * Demo mode (NEXT_PUBLIC_API_MODE=mock, no backend required) is kept
 * deliberately rather than deleted — useful for offline demos / a thesis
 * defense without a live server running.
 */
import type {
  AgentEvent,
  AnalysisResult,
  ChatMessage,
  SessionDetail,
  SessionListItem,
  SessionSummary,
} from "@/lib/types";
import {
  MOCK_SESSION_DETAIL,
  MOCK_ANALYSIS_RESULTS,
  MOCK_PROGRESS_TIMELINE,
  MOCK_TIMELINE_TOTAL_MS,
  MOCK_SESSIONS_LIST,
  MOCK_CHAT_PAIRS,
  MOCK_ROUTING_DECISION,
} from "@/lib/mock";

export const API_MODE: "mock" | "real" =
  (process.env.NEXT_PUBLIC_API_MODE as "mock" | "real" | undefined) ?? "real";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Api {
  uploadSession(file: File, goal: string): Promise<SessionSummary>;
  triggerAnalysis(id: string): Promise<{ id: string; status: string }>;
  getSession(id: string): Promise<SessionDetail>;
  getSessionEvents(id: string): Promise<AgentEvent[]>;
  getSessionResults(id: string): Promise<AnalysisResult[]>;
  listSessions(): Promise<SessionListItem[]>;
  renameSession(id: string, name: string): Promise<SessionDetail>;
  deleteSession(id: string): Promise<void>;
  sendChatMessage(id: string, question: string): Promise<{ question: string; answer: string }>;
  getChatHistory(id: string): Promise<ChatMessage[]>;
  getReportUrl(id: string): string | null;
}

// ---------------------------------------------------------------------------
// Real implementation — talks to the FastAPI backend.
// ---------------------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, detail.detail ?? response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

const realApi: Api = {
  async uploadSession(file, goal) {
    const form = new FormData();
    form.append("file", file);
    form.append("goal", goal);
    return request<SessionSummary>("/sessions", { method: "POST", body: form });
  },
  async triggerAnalysis(id) {
    return request(`/sessions/${id}/analyze`, { method: "POST" });
  },
  async getSession(id) {
    return request<SessionDetail>(`/sessions/${id}`);
  },
  async getSessionEvents(id) {
    return request<AgentEvent[]>(`/sessions/${id}/events`);
  },
  async getSessionResults(id) {
    return request<AnalysisResult[]>(`/sessions/${id}/results`);
  },
  async listSessions() {
    return request<SessionListItem[]>("/sessions");
  },
  async renameSession(id, name) {
    return request<SessionDetail>(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },
  async deleteSession(id) {
    await request(`/sessions/${id}`, { method: "DELETE" });
  },
  async sendChatMessage(id, question) {
    return request(`/sessions/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },
  async getChatHistory(id) {
    return request<ChatMessage[]>(`/sessions/${id}/chat`);
  },
  getReportUrl(id) {
    return `${API_BASE_URL}/sessions/${id}/report`;
  },
};

// ---------------------------------------------------------------------------
// Mock implementation — in-memory, deterministic, no network.
// ---------------------------------------------------------------------------

// Default to "already complete" (Infinity elapsed) so navigating straight to
// a results page (e.g. from the Sessions list) works without a progress run.
// Reset to "just started" by triggerAnalysis(), so the flow that follows
// upload -> analyze -> progress sees a live replay of the scripted timeline.
let mockAnalysisStartedAt = -Infinity;
let mockSubmittedGoal: string = MOCK_SESSION_DETAIL.goal;
let mockSessionName: string = MOCK_SESSION_DETAIL.name;
const mockChatHistory: ChatMessage[] = [];

function mockElapsedMs(): number {
  return Date.now() - mockAnalysisStartedAt;
}

function mockStatus(): SessionDetail["status"] {
  const elapsed = mockElapsedMs();
  if (elapsed < 0) return "uploaded";
  if (elapsed < MOCK_TIMELINE_TOTAL_MS) return "running";
  return "completed";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockApi: Api = {
  async uploadSession(_file, goal) {
    await delay(400);
    mockAnalysisStartedAt = -Infinity;
    mockSubmittedGoal = goal || MOCK_SESSION_DETAIL.goal;
    return {
      id: MOCK_SESSION_DETAIL.id,
      name: MOCK_SESSION_DETAIL.name,
      filename: MOCK_SESSION_DETAIL.filename,
      goal: mockSubmittedGoal,
      status: "uploaded",
      corpus_stats: MOCK_SESSION_DETAIL.corpus_stats,
      created_at: new Date().toISOString(),
    };
  },
  async triggerAnalysis(id) {
    mockAnalysisStartedAt = Date.now();
    return { id, status: "running" };
  },
  async getSession(id) {
    const status = mockStatus();
    const elapsed = mockElapsedMs();
    const coordinatorDone = elapsed >= 1100;
    return {
      ...MOCK_SESSION_DETAIL,
      id,
      name: mockSessionName,
      goal: mockSubmittedGoal,
      status,
      routing_decision: coordinatorDone ? MOCK_ROUTING_DECISION : null,
      executive_summary: status === "completed" ? MOCK_SESSION_DETAIL.executive_summary : null,
    };
  },
  async getSessionEvents() {
    const elapsed = mockElapsedMs();
    return MOCK_PROGRESS_TIMELINE.filter((step) => step.event && step.atMs <= elapsed).map(
      (step) => ({
        ...step.event!,
        created_at: new Date(mockAnalysisStartedAt + step.atMs).toISOString(),
      })
    );
  },
  async getSessionResults() {
    return mockStatus() === "completed" ? MOCK_ANALYSIS_RESULTS : [];
  },
  async listSessions() {
    await delay(150);
    return MOCK_SESSIONS_LIST.map((s) => ({
      id: s.id,
      name: s.name,
      filename: s.filename,
      goal: s.goal,
      status: s.status,
      routing_decision: {
        activated: s.activated,
        skipped: [],
        justification: "",
        clarification_needed: false,
        clarification_message: null,
      },
      created_at: s.created_at,
    }));
  },
  async renameSession(id, name) {
    mockSessionName = name;
    return { ...MOCK_SESSION_DETAIL, id, name, goal: mockSubmittedGoal };
  },
  async deleteSession() {
    await delay(200);
  },
  async sendChatMessage(_id, question) {
    await delay(500);
    const match = MOCK_CHAT_PAIRS.find(
      (pair) => pair.question.toLowerCase() === question.toLowerCase()
    );
    const answer =
      match?.answer ??
      "Grounded only in this session's stored analysis, I don't have a direct answer for that — try asking about the gaps, recommendations, trends, or activated specialists.";
    mockChatHistory.push({ role: "user", content: question, created_at: new Date().toISOString() });
    mockChatHistory.push({ role: "assistant", content: answer, created_at: new Date().toISOString() });
    return { question, answer };
  },
  async getChatHistory() {
    return mockChatHistory;
  },
  getReportUrl() {
    return null; // PDF generation requires the live backend.
  },
};

export const api: Api = API_MODE === "mock" ? mockApi : realApi;
