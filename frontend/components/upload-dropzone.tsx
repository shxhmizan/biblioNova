"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({
  file,
  onFileChange,
  error,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".bib")) {
      setLocalError("Only .bib files are accepted.");
      onFileChange(null);
      return;
    }
    setLocalError(null);
    onFileChange(picked);
  }

  async function tryWithSample() {
    const response = await fetch("/sample.bib");
    const blob = await response.blob();
    const sampleFile = new File([blob], "sample.bib", { type: "text/plain" });
    setLocalError(null);
    onFileChange(sampleFile);
  }

  const displayError = localError ?? error;

  if (file) {
    return (
      <div className="surface-raised rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_var(--surface-highlight)]">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · BibTeX</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onFileChange(null)}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "surface-inset flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
          dragActive ? "border-primary bg-primary/10 shadow-[inset_0_2px_8px_var(--surface-deep)]" : "border-border hover:border-primary/50 hover:bg-muted/45",
          displayError && "border-destructive/50"
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_var(--surface-highlight),0_6px_12px_-10px_var(--primary)]">
          <Upload className="size-6" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drag and drop your .bib file, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Exported from Web of Science
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".bib"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {displayError && <p className="mt-2 text-xs text-destructive">{displayError}</p>}
      <button
        type="button"
        onClick={tryWithSample}
        className="mt-3 inline-flex rounded-lg px-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        Try with sample: LLM/agentic AI research corpus
      </button>
    </div>
  );
}
