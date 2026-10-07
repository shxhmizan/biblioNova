import { ArrowRight, FileText, MessageSquareText, Network, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";

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

export default function LandingPage() {
  return (
    <div className="app-canvas flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border/90 bg-card/55 px-6 py-4 shadow-[inset_0_-1px_0_var(--surface-highlight)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-[inset_0_1px_0_var(--surface-highlight),0_5px_12px_-8px_var(--primary)]">
            <Network className="size-5" strokeWidth={2.25} />
          </span>
          <span>
            <span className="block font-semibold tracking-tight">BiblioAgent</span>
            <span className="block text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Research desk</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <WelcomeModal />
          <ThemeToggle />
          <LinkButton href="/analyze" size="sm">
            Start Analysis
          </LinkButton>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-18 text-center sm:py-24">
          <span className="mb-5 rounded-full border border-border bg-card/70 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground shadow-[inset_0_1px_0_var(--surface-highlight)] uppercase">
            Agentic intelligence · MCP research tools
          </span>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
            Bibliometric analysis that adapts to your research question
          </h1>
          <p className="mt-6 max-w-2xl text-balance leading-7 text-muted-foreground">
            Upload a BibTeX dataset, state your goal, and a multi-agent system selectively
            activates only the specialists it needs — producing visualizations, research gaps,
            future topics, and a downloadable report.
          </p>
          <LinkButton href="/analyze" size="lg" className="mt-9 h-11 px-5 text-sm">
            Start Analysis
            <ArrowRight className="size-4" />
          </LinkButton>
          <div className="surface-inset mt-12 grid w-full max-w-4xl overflow-hidden rounded-2xl p-1 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex items-center gap-3 rounded-xl px-4 py-3 text-left sm:block sm:px-5 sm:py-5">
                {i > 0 && <span className="absolute inset-y-3 left-0 hidden w-px bg-border sm:block" />}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_var(--surface-highlight)]">
                  <step.icon className="size-4" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Step 0{i + 1}</span>
                  <span className="mt-0.5 block text-sm font-medium">{step.title}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/80 bg-card/25 px-6 py-14 shadow-[inset_0_1px_0_var(--surface-highlight)]">
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="surface-raised flex flex-col items-start gap-3 rounded-2xl p-5">
                <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-semibold text-primary shadow-[inset_0_1px_0_var(--surface-highlight)]">
                  {i + 1}
                </div>
                <step.icon className="size-5 text-primary/75" strokeWidth={1.75} />
                <h3 className="font-medium tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 px-6 py-6 text-center text-xs text-muted-foreground">
        BiblioAgent · A deliberate workspace for evidence-led research
      </footer>
    </div>
  );
}
