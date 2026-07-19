"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { StatusBadge, type SessionStatus } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Topbar({
  breadcrumb,
  sessionName,
  onSessionNameChange,
  status,
  right,
}: {
  breadcrumb: BreadcrumbItem[];
  sessionName?: string;
  onSessionNameChange?: (name: string) => void;
  status?: SessionStatus;
  right?: React.ReactNode;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(sessionName ?? "");

  React.useEffect(() => setDraft(sessionName ?? ""), [sessionName]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== sessionName) {
      onSessionNameChange?.(trimmed);
    } else {
      setDraft(sessionName ?? "");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(!sessionName && "text-foreground font-medium")}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {sessionName !== undefined && (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(sessionName ?? "");
                    setEditing(false);
                  }
                }}
                className="min-w-0 rounded border border-input bg-transparent px-1.5 py-0.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <button
                onClick={() => onSessionNameChange && setEditing(true)}
                className="group flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground"
                disabled={!onSessionNameChange}
              >
                <span className="truncate">{sessionName}</span>
                {onSessionNameChange && (
                  <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            )}
          </>
        )}

        {status && <StatusBadge status={status} className="shrink-0" />}
      </div>

      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
