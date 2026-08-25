"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { UploadDropzone } from "@/components/upload-dropzone";
import { GoalInput } from "@/components/goal-input";
import { PaperSearchForm } from "@/components/paper-search-form";
import { PaperReviewList } from "@/components/paper-review-list";
import { AcquisitionProgress } from "@/components/acquisition-progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import type { AcquisitionCandidate } from "@/lib/types";

const MIN_GOAL_LENGTH = 20;
const MIN_QUERY_LENGTH = 3;

type Mode = "upload" | "search";
type SearchPhase = "idle" | "searching" | "reviewing" | "clarification";

export default function NewAnalysisPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("upload");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Upload mode
  const [file, setFile] = React.useState<File | null>(null);
  const [goal, setGoal] = React.useState("");

  // Search mode
  const [query, setQuery] = React.useState("");
  const [yearFrom, setYearFrom] = React.useState("");
  const [yearTo, setYearTo] = React.useState("");
  const [maxResults, setMaxResults] = React.useState(100);
  const [searchPhase, setSearchPhase] = React.useState<SearchPhase>("idle");
  const [searchSessionId, setSearchSessionId] = React.useState<string | null>(null);
  const [candidates, setCandidates] = React.useState<AcquisitionCandidate[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [clarificationMessage, setClarificationMessage] = React.useState<string | null>(null);
  const [searchGoal, setSearchGoal] = React.useState("");

  const canSubmitUpload = file !== null && goal.trim().length >= MIN_GOAL_LENGTH && !submitting;
  const canSearch = query.trim().length >= MIN_QUERY_LENGTH && searchPhase !== "searching";
  const selectedCandidates = candidates.filter((c) => selected.has(c.bibtex_key));
  const canRunSearchAnalysis =
    searchSessionId !== null &&
    selectedCandidates.length > 0 &&
    searchGoal.trim().length >= MIN_GOAL_LENGTH &&
    !submitting;

  async function handleUploadSubmit() {
    if (!file || !canSubmitUpload) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.uploadSession(file, goal.trim());
      await api.triggerAnalysis(session.id);
      router.push(`/analyze/${session.id}/progress`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleSearch() {
    if (!canSearch) return;
    setSearchPhase("searching");
    setError(null);
    try {
      const result = await api.searchPapers({
        query: query.trim(),
        year_from: yearFrom ? Number(yearFrom) : undefined,
        year_to: yearTo ? Number(yearTo) : undefined,
        max_results: maxResults,
      });
      setSearchSessionId(result.id);
      setCandidates(result.candidates);
      if (result.status === "needs_clarification") {
        setClarificationMessage(result.message);
        setSearchPhase("clarification");
      } else {
        setSelected(new Set(result.candidates.map((c) => c.bibtex_key)));
        setSearchPhase("reviewing");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
      setSearchPhase("idle");
    }
  }

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(candidates.map((c) => c.bibtex_key)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function tryDifferentSearch() {
    setSearchPhase("idle");
    setClarificationMessage(null);
  }

  async function handleRunSearchAnalysis() {
    if (!searchSessionId || !canRunSearchAnalysis) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.confirmSearch(
        searchSessionId,
        searchGoal.trim(),
        selectedCandidates
      );
      await api.triggerAnalysis(session.id);
      router.push(`/analyze/${session.id}/progress`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Topbar breadcrumb={[{ label: "New Analysis" }]} />

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-28 md:px-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Couldn&apos;t start analysis</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode);
            setError(null);
          }}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="upload">Upload my own file</TabsTrigger>
            <TabsTrigger value="search">Search for papers</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "upload" && (
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-medium text-foreground">Dataset</h2>
              <UploadDropzone file={file} onFileChange={setFile} />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-medium text-foreground">Research goal</h2>
              <GoalInput value={goal} onChange={setGoal} />
            </div>
          </div>
        )}

        {mode === "search" && searchPhase === "idle" && (
          <div className="max-w-lg">
            <h2 className="mb-3 text-sm font-medium text-foreground">Research area</h2>
            <PaperSearchForm
              query={query}
              onQueryChange={setQuery}
              yearFrom={yearFrom}
              onYearFromChange={setYearFrom}
              yearTo={yearTo}
              onYearToChange={setYearTo}
              maxResults={maxResults}
              onMaxResultsChange={setMaxResults}
            />
          </div>
        )}

        {mode === "search" && searchPhase === "searching" && (
          <div className="max-w-lg">
            <AcquisitionProgress query={query.trim()} />
          </div>
        )}

        {mode === "search" && searchPhase === "clarification" && (
          <div className="max-w-lg space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Not enough matching papers</AlertTitle>
              <AlertDescription>{clarificationMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {mode === "search" && searchPhase === "reviewing" && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-sm font-medium text-foreground">
                {candidates.length} paper{candidates.length === 1 ? "" : "s"} found for &ldquo;
                {query.trim()}&rdquo;
              </h2>
              <PaperReviewList
                candidates={candidates}
                selected={selected}
                onToggle={toggleSelected}
                onSelectAll={selectAll}
                onSelectNone={selectNone}
              />
            </div>
            <div className="max-w-lg">
              <h2 className="mb-3 text-sm font-medium text-foreground">Research goal</h2>
              <GoalInput value={searchGoal} onChange={setSearchGoal} />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-14 z-20 border-t bg-background/95 px-4 py-4 backdrop-blur md:bottom-0 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          {mode === "upload" && (
            <>
              <p className="text-xs text-muted-foreground">
                {canSubmitUpload
                  ? "Ready to run — the Coordinator will decide which specialists to activate."
                  : "Add a dataset and a research goal (min 20 characters) to continue."}
              </p>
              <Button onClick={handleUploadSubmit} disabled={!canSubmitUpload}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Run Analysis
              </Button>
            </>
          )}

          {mode === "search" && searchPhase === "idle" && (
            <>
              <p className="text-xs text-muted-foreground">
                {query.trim().length >= MIN_QUERY_LENGTH
                  ? "Ready to search OpenAlex and arXiv."
                  : "Enter a research area (min 3 characters) to search."}
              </p>
              <Button onClick={handleSearch} disabled={!canSearch}>
                Search
              </Button>
            </>
          )}

          {mode === "search" && searchPhase === "searching" && (
            <p className="text-xs text-muted-foreground">Searching OpenAlex and arXiv…</p>
          )}

          {mode === "search" && searchPhase === "clarification" && (
            <>
              <p className="text-xs text-muted-foreground">Try a broader research area.</p>
              <Button variant="outline" onClick={tryDifferentSearch}>
                Search again
              </Button>
            </>
          )}

          {mode === "search" && searchPhase === "reviewing" && (
            <>
              <p className="text-xs text-muted-foreground">
                {selectedCandidates.length === 0
                  ? "Select at least one paper to continue."
                  : canRunSearchAnalysis
                    ? "Ready to run — the Coordinator will decide which specialists to activate."
                    : "Add a research goal (min 20 characters) to continue."}
              </p>
              <Button onClick={handleRunSearchAnalysis} disabled={!canRunSearchAnalysis}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Run Analysis
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
