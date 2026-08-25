"use client";

import { Input } from "@/components/ui/input";

const MAX_RESULTS_MIN = 20;
const MAX_RESULTS_MAX = 300;
const MAX_RESULTS_STEP = 20;

export function PaperSearchForm({
  query,
  onQueryChange,
  yearFrom,
  onYearFromChange,
  yearTo,
  onYearToChange,
  maxResults,
  onMaxResultsChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  yearFrom: string;
  onYearFromChange: (value: string) => void;
  yearTo: string;
  onYearToChange: (value: string) => void;
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="e.g. agentic AI applications in healthcare"
          className="h-10"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Describe the research area or a specific title — Data Acquisition searches OpenAlex
          and arXiv for matching papers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            From year (optional)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            value={yearFrom}
            onChange={(e) => onYearFromChange(e.target.value)}
            placeholder="e.g. 2020"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            To year (optional)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            value={yearTo}
            onChange={(e) => onYearToChange(e.target.value)}
            placeholder="e.g. 2026"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Max results</label>
          <span className="font-mono-tabular text-xs text-foreground">{maxResults}</span>
        </div>
        <input
          type="range"
          min={MAX_RESULTS_MIN}
          max={MAX_RESULTS_MAX}
          step={MAX_RESULTS_STEP}
          value={maxResults}
          onChange={(e) => onMaxResultsChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}
