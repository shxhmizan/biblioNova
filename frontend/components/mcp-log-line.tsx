import { AGENT_LABELS, SPECIALIST_AGENTS, type AgentEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const MCP_SERVER_BY_AGENT: Partial<Record<string, string>> = {
  bibliometric_analyst: "bibliometric-analysis-server",
  science_mapping: "science-mapping-server",
};

function formatLine(event: AgentEvent): { prefix: string; text: string; tone: "default" | "muted" | "accent" } {
  const server = event.agent_name ? MCP_SERVER_BY_AGENT[event.agent_name] : undefined;
  const prefix = server ? `[${server}]` : event.agent_name ? `[${event.agent_name}]` : "[coordinator]";

  switch (event.event_type) {
    case "agent_started":
      return { prefix, text: `${event.agent_name ? AGENT_LABELS[event.agent_name] : "Coordinator"} started`, tone: "accent" };
    case "agent_skipped":
      return { prefix, text: `skipped — ${(event.payload.reason as string) ?? "not required for this goal"}`, tone: "muted" };
    case "tool_discovered": {
      const tools = (event.payload.tools as string[]) ?? [];
      return { prefix, text: `tools/list → ${tools.length} tool${tools.length === 1 ? "" : "s"} discovered (${tools.join(", ")})`, tone: "default" };
    }
    case "tool_called": {
      const tool = event.payload.tool as string;
      const duration = event.payload.duration_seconds as number | undefined;
      return {
        prefix,
        text: `tools/call ${tool}() → completed${duration !== undefined ? ` (${duration.toFixed(1)}s)` : ""}`,
        tone: "default",
      };
    }
    case "agent_completed":
      return { prefix, text: "completed", tone: "accent" };
    default:
      return { prefix, text: event.event_type, tone: "default" };
  }
}

export function McpLogLine({ event }: { event: AgentEvent }) {
  const { prefix, text, tone } = formatLine(event);
  const isSpecialistServer = event.agent_name && SPECIALIST_AGENTS.includes(event.agent_name);

  return (
    <div className="flex gap-2 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
      <span
        className={cn(
          "shrink-0",
          isSpecialistServer ? "text-primary" : "text-muted-foreground"
        )}
      >
        {prefix}
      </span>
      <span
        className={cn(
          tone === "muted" && "text-muted-foreground",
          tone === "accent" && "text-foreground font-medium",
          tone === "default" && "text-foreground/80"
        )}
      >
        {text}
      </span>
    </div>
  );
}
