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
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Network className="size-5 text-primary" strokeWidth={2.25} />
          <span className="font-semibold tracking-tight">BiblioAgent</span>
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
      </main>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        <span className="mx-2 text-muted-foreground/40">·</span>
        version 1.2.0 by Shahmizan Nordin
      </footer>
    </div>
  );
}
