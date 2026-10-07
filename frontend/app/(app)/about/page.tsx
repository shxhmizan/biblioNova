import { Topbar } from "@/components/layout/topbar";

const AGENTS = [
  { name: "Coordinator", description: "Interprets the research goal and selectively activates specialists." },
  { name: "Bibliometric Analyst", description: "Publication trends, citation analysis, author/journal rankings." },
  { name: "Science Mapping", description: "Keyword co-occurrence and co-citation networks." },
  { name: "Text Mining", description: "Semantic clustering via sentence embeddings and Gaussian Mixture Models." },
  { name: "Insights & Reporting", description: "Synthesizes findings into research gaps and the PDF report." },
  { name: "Research Advisor", description: "Maps future research recommendations 1:1 to identified gaps." },
];

export default function AboutPage() {
  return (
    <div className="min-h-svh">
      <Topbar breadcrumb={[{ label: "About" }]} />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 md:px-6">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">The instrument</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">BiblioAgent</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Agentic AI System with Model Context Protocol (MCP)-Based Integration for Automated
            Bibliometric Analysis — a Final Year Project at Universiti Teknologi MARA.
          </p>
        </div>

        <div className="surface-raised rounded-2xl p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Why it&apos;s different</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Fixed-pipeline bibliometric tools like VOSviewer run the same analysis regardless of
            what you&apos;re trying to learn. BiblioAgent&apos;s Coordinator interprets your research goal
            and selectively activates only the specialists it needs — different goals produce
            different execution paths, not just different filters on the same output.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">The agents</h2>
          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <div key={agent.name} className="surface-raised rounded-xl p-4">
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-raised rounded-2xl p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">How tools are discovered</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The Bibliometric Analyst and Science Mapping agents don&apos;t call hardcoded
            functions — they discover tools at runtime from Model Context Protocol servers via
            genuine <code className="rounded bg-muted px-1 py-0.5 text-[11px]">tools/list</code>{" "}
            and <code className="rounded bg-muted px-1 py-0.5 text-[11px]">tools/call</code>{" "}
            requests. Adding a tool to a server requires no agent code changes.
          </p>
        </div>
      </div>
    </div>
  );
}
