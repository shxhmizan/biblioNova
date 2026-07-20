"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { UploadDropzone } from "@/components/upload-dropzone";
import { GoalInput } from "@/components/goal-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";

const MIN_GOAL_LENGTH = 20;

export default function NewAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [goal, setGoal] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = file !== null && goal.trim().length >= MIN_GOAL_LENGTH && !submitting;

  async function handleSubmit() {
    if (!file || !canSubmit) return;
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
      </div>

      <div className="sticky bottom-14 z-20 border-t bg-background/95 px-4 py-4 backdrop-blur md:bottom-0 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {file && goal.trim().length >= MIN_GOAL_LENGTH
              ? "Ready to run — the Coordinator will decide which specialists to activate."
              : "Add a dataset and a research goal (min 20 characters) to continue."}
          </p>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Run Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
