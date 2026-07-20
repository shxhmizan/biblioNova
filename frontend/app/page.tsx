import { ArrowRight, FileText, MessageSquareText, Network, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const STEPS = [
  {
    icon: FileText,
    title: "Upload BibTeX",
    description: "Export your Web of Science search results as a .bib file and drop it in.",
  },
  {
    icon: MessageSquareText,
    title: "State your goal",
    description: "Describe what you want to learn — in plain language, not query syntax.",
  },
  {
    icon: Sparkles,
    title: "Agents analyze",
    description: "The Coordinator activates only the specialists your goal actually needs.",
  },
];

const PIPELINE = [
  "Coordinator",
  "Bibliometric Analyst",
  "Science Mapping",
  "Text Mining",
  "MCP Servers",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Network className="size-5 text-primary" strokeWidth={2.25} />
          <span className="font-semibold tracking-tight">BiblioAgent</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LinkButton href="/analyze" size="sm">
            Start Analysis
          </LinkButton>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
          <span className="mb-4 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            Agentic AI · Model Context Protocol
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Bibliometric analysis that adapts to your research question
          </h1>
          <p className="mt-5 max-w-xl text-balance text-muted-foreground">
            Upload a BibTeX dataset, state your goal, and a multi-agent system selectively
            activates only the specialists it needs — producing visualizations, research gaps,
            future topics, and a downloadable report.
          </p>
          <LinkButton href="/analyze" size="lg" className="mt-8">
            Start Analysis
            <ArrowRight className="size-4" />
          </LinkButton>
        </section>

        <section className="border-t bg-muted/20 px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <step.icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Selective agent activation, not a fixed pipeline
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 overflow-x-auto">
              {PIPELINE.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground">
                    {step}
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground">
              Unlike fixed-pipeline tools like VOSviewer, different goals activate different
              agents — the execution path adapts to what you actually asked for.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Final Year Project — Universiti Teknologi MARA
      </footer>
    </div>
  );
}
