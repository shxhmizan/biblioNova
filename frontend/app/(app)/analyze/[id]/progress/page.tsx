"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { AgentCard } from "@/components/agent-card";
import { McpLogLine } from "@/components/mcp-log-line";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, API_MODE } from "@/lib/api";
import { MOCK_PROGRESS_TIMELINE } from "@/lib/mock";
import {
  PIPELINE_AGENTS,
  SPECIALIST_AGENTS,
  type AgentEvent,
  type AgentName,
  type AgentUiState,
  type SessionDetail,
} from "@/lib/types";

const POLL_INTERVAL_MS = 400;

interface AgentState {
  state: AgentUiState;
  durationSeconds?: number;
  skipReason?: string;
}

function deriveAgentStates(events: AgentEvent[]): Record<AgentName, AgentState> {
  const map = Object.fromEntries(
    PIPELINE_AGENTS.map((a) => [a, { state: "queued" as AgentUiState }])
  ) as Record<AgentName, AgentState>;
  const startedAt: Partial<Record<AgentName, number>> = {};

  for (const event of events) {
    const agent = event.agent_name;
    if (!agent) continue;
    if (event.event_type === "agent_started") {
      map[agent] = { state: "active" };
      startedAt[agent] = new Date(event.created_at).getTime();
    } else if (event.event_type === "agent_completed") {
      const started = startedAt[agent];
      const completed = new Date(event.created_at).getTime();
      map[agent] = {
        state: "done",
        durationSeconds: started ? (completed - started) / 1000 : undefined,
      };
    } else if (event.event_type === "agent_skipped") {
      map[agent] = { state: "skipped", skipReason: event.payload.reason as string };
    }
  }
  return map;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = React.useState<SessionDetail | null>(null);
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [logOpen, setLogOpen] = React.useState(true);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const startRef = React.useRef<number>(0);
  const logEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    startRef.current = Date.now();

    async function poll() {
      const [sess, evts] = await Promise.all([api.getSession(id), api.getSessionEvents(id)]);
      if (cancelled) return;
      setSession(sess);
      setEvents(evts);

      if (sess.status === "completed") {
        redirectTimer = setTimeout(() => router.push(`/analyze/${id}`), 900);
        return;
      }
      if (sess.status === "failed" || sess.status === "needs_clarification") {
        return;
      }
      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    }
    poll();

    const tick = setInterval(() => setElapsedMs(Date.now() - startRef.current), 200);

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(redirectTimer);
      clearInterval(tick);
    };
  }, [id, router]);

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const agentStates = deriveAgentStates(events);
  const doneOrSkipped = PIPELINE_AGENTS.filter((a) =>
    ["done", "skipped"].includes(agentStates[a].state)
  ).length;
  const progressPct = Math.round((doneOrSkipped / PIPELINE_AGENTS.length) * 100);
  const logEvents = events.filter(
    (e) => e.event_type === "tool_discovered" || e.event_type === "tool_called"
  );

  // Demo-only enrichment: the real backend has no incremental "reasoning" event
  // type (the Coordinator's LLM call isn't streamed), so this only appears in
  // mock mode. Real mode shows the Coordinator's justification once it completes.
  const reasoningLines =
    API_MODE === "mock"
      ? MOCK_PROGRESS_TIMELINE.filter((s) => s.reasoningLine && s.atMs <= elapsedMs).map(
          (s) => s.reasoningLine!
        )
      : [];

  const routingDecision = session?.routing_decision ?? null;
  const needsClarification = routingDecision?.clarification_needed ?? false;

  return (
    <div className="flex min-h-svh flex-col">
      <Topbar
        breadcrumb={[{ label: "New Analysis", href: "/analyze" }, { label: "Progress" }]}
        status={session?.status}
      />

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6 md:px-6">
        {/* Coordinator decision card */}
        <div className="rounded-lg border bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Coordinator
          </span>
          <p className="mt-2 text-sm text-foreground">{session?.goal ?? "…"}</p>

          {reasoningLines.length > 0 && !routingDecision && (
            <div className="mt-3 space-y-1 border-t pt-3">
              {reasoningLines.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          )}

          {routingDecision && !needsClarification && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm text-foreground">{routingDecision.justification}</p>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALIST_AGENTS.map((agent) => {
                  const activated = routingDecision.activated.includes(agent);
                  const skip = routingDecision.skipped.find((s) => s.agent === agent);
                  return (
                    <span
                      key={agent}
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-medium " +
                        (activated
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground")
                      }
                      title={skip?.reason}
                    >
                      {activated ? "✓ " : "— "}
                      {agent.replace(/_/g, " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {needsClarification && (
            <div className="mt-4 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              {routingDecision?.clarification_message ??
                "This goal needs clarification before analysis can run."}
            </div>
          )}
        </div>

        {!needsClarification && (
          <>
            {/* Agent pipeline */}
            <div className="flex flex-wrap gap-3">
              {PIPELINE_AGENTS.map((agent) => (
                <AgentCard
                  key={agent}
                  agent={agent}
                  state={agentStates[agent].state}
                  durationSeconds={agentStates[agent].durationSeconds}
                  skipReason={agentStates[agent].skipReason}
                />
              ))}
            </div>

            {/* MCP activity log */}
            <div className="rounded-lg border bg-card">
              <button
                onClick={() => setLogOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground"
              >
                MCP activity log
                {logOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>
              {logOpen && (
                <div className="max-h-56 space-y-1 overflow-y-auto border-t px-4 py-3">
                  {logEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground">Waiting for tool calls…</p>
                  )}
                  {logEvents.map((event, i) => (
                    <McpLogLine key={i} event={event} />
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Overall progress footer */}
      <div className="sticky bottom-14 z-20 space-y-2 border-t bg-background/95 px-4 py-4 backdrop-blur md:bottom-0 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Progress value={progressPct} className="h-1.5 flex-1" />
          <span className="w-14 shrink-0 font-mono-tabular text-xs text-muted-foreground">
            {formatElapsed(elapsedMs)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => router.push("/analyze")}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
