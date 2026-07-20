"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, MessageSquareText, Network, Sparkles, Workflow } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/onboarding";

const SLIDES = [
  {
    icon: Sparkles,
    title: "Welcome to BiblioAgent",
    description:
      "An agentic AI system that automates bibliometric analysis. Upload a BibTeX dataset, describe your research goal in plain language, and a multi-agent system does the rest.",
  },
  {
    icon: Workflow,
    title: "Selective agent activation",
    description:
      "Unlike fixed-pipeline tools like VOSviewer, a Coordinator agent reads your goal and activates only the specialists it actually needs — different questions take different execution paths.",
  },
  {
    icon: Network,
    title: "Genuine MCP tool calls",
    description:
      "Specialists discover and call real tools over the Model Context Protocol for citation analysis, keyword networks, and more — every call is logged live as it happens.",
  },
  {
    icon: MessageSquareText,
    title: "Explore, then ask",
    description:
      "Results land in an interactive dashboard — trends, networks, semantic clusters, research gaps — plus a grounded chatbot that answers questions and links back to the right chart.",
  },
] as const;

export function WelcomeModal() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    // Must run post-hydration, not during render: localStorage is
    // unavailable on the server, so computing `open` synchronously would
    // either always render closed (SSR) or mismatch against it on the
    // client's first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasSeenWelcome()) setOpen(true);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      markWelcomeSeen();
      setStep(0);
    }
  }

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="text-sm text-muted-foreground transition-colors hover:text-foreground" />
        }
      >
        How it works
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogTitle className="sr-only">{slide.title}</DialogTitle>
        <DialogDescription className="sr-only">{slide.description}</DialogDescription>

        <div className="flex flex-col items-center gap-4 px-2 pt-4 pb-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <slide.icon className="size-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-medium text-foreground">{slide.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{slide.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === step}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === step ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
          {isLast ? (
            <Button size="sm" onClick={() => handleOpenChange(false)}>
              Get started
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Next
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
