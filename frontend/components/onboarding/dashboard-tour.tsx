"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TourStep {
  id: string;
  title: string;
  description: string;
}

const HIGHLIGHT_PAD = 8;
const CARD_WIDTH = 320;
const CARD_MARGIN = 16;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Spotlight product tour: scrolls each step's target section into view and
 * frames it with a box-shadow "cutout" (a single element whose own box stays
 * undimmed while its box-shadow dims everything else — avoids clip-path
 * masking entirely). Manual-only: never auto-opens, launched via the trigger
 * button this component renders.
 */
export function DashboardTour({ steps }: { steps: TourStep[] }) {
  const [open, setOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const recomputeRect = React.useCallback(() => {
    if (!step) return;
    const el = document.getElementById(step.id);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Scroll the target into view on every step change, then track its
  // position continuously while the tour is open (smooth-scroll and window
  // resize both move the target after the initial measurement).
  React.useEffect(() => {
    if (!open || !step) return;
    const el = document.getElementById(step.id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    let raf: number;
    const tick = () => {
      recomputeRect();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, step, recomputeRect]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function start() {
    setStepIndex(0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  const cardPosition = React.useMemo(() => {
    if (!rect) return null;
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
    const spaceBelow = viewportH - (rect.top + rect.height + HIGHLIGHT_PAD);
    const placeBelow = spaceBelow > 180 || rect.top < 180;
    const top = placeBelow
      ? Math.min(rect.top + rect.height + HIGHLIGHT_PAD + 12, viewportH - 200)
      : Math.max(rect.top - HIGHLIGHT_PAD - 12, 16);
    const left = Math.min(
      Math.max(rect.left, CARD_MARGIN),
      viewportW - CARD_WIDTH - CARD_MARGIN
    );
    return { top, left, placeBelow };
  }, [rect]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={start}>
        <Compass className="size-3.5" />
        Take a tour
      </Button>

      {open && step && (
        <>
          {/* Click-blocking layer — sits under the spotlight/card so both of
              those remain interactive while everything else is inert. */}
          <div
            className="fixed inset-0 z-[65]"
            onClick={close}
            aria-hidden="true"
          />

          {rect && (
            <div
              className="pointer-events-none fixed z-[66] rounded-lg ring-2 ring-primary transition-all duration-300 ease-out"
              style={{
                top: rect.top - HIGHLIGHT_PAD,
                left: rect.left - HIGHLIGHT_PAD,
                width: rect.width + HIGHLIGHT_PAD * 2,
                height: rect.height + HIGHLIGHT_PAD * 2,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              }}
            />
          )}

          <div
            className={cn(
              "fixed z-[67] w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-xl transition-all duration-300 ease-out",
              !cardPosition && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
            style={cardPosition ? { top: cardPosition.top, left: cardPosition.left } : undefined}
            role="dialog"
            aria-label={`Tour step ${stepIndex + 1} of ${steps.length}: ${step.title}`}
          >
            <button
              onClick={close}
              aria-label="Close tour"
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h3 className="mt-1 text-sm font-medium text-foreground">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStepIndex((i) => i - 1)}
                disabled={stepIndex === 0}
              >
                <ArrowLeft className="size-3.5" />
                Back
              </Button>
              {isLast ? (
                <Button size="sm" onClick={close}>
                  Done
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStepIndex((i) => i + 1)}>
                  Next
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
