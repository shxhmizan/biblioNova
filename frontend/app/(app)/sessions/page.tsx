"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Trash2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LinkButton } from "@/components/link-button";
import { api } from "@/lib/api";
import {
  AGENT_LABELS,
  SPECIALIST_AGENTS,
  type SessionListItem,
  type SessionStatusValue,
} from "@/lib/types";

const AGENT_INITIALS: Record<string, string> = {
  bibliometric_analyst: "BA",
  science_mapping: "SM",
  text_mining: "TM",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// "running" sessions keep executing server-side even after a user navigates
// away (see backend/app/services/analysis_runner.py, a plain FastAPI
// background task) — clicking back in should resume watching progress, not
// hit a results page with nothing to show yet. failed/needs_clarification
// sessions also route here since that's where their terminal-state UI lives.
function sessionHref(session: { id: string; status: SessionStatusValue }): string {
  return session.status === "completed"
    ? `/analyze/${session.id}`
    : `/analyze/${session.id}/progress`;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<SessionListItem[] | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    api.listSessions().then(setSessions);
  }, []);

  React.useEffect(load, [load]);

  async function handleDelete(id: string) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteSession(id);
      setDeletingId(null);
      load();
    } catch {
      setDeleteError("Couldn't delete this session. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-svh">
      <Topbar breadcrumb={[{ label: "Sessions" }]} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {sessions === null && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {sessions?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
            <FolderOpen className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">No analyses yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Upload a BibTeX dataset and state a research goal to run your first analysis.
            </p>
            <LinkButton href="/analyze" size="sm" className="mt-2">
              Start Analysis
            </LinkButton>
          </div>
        )}

        {sessions !== null && sessions.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Specialists</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer"
                    onClick={() => router.push(sessionHref(session))}
                  >
                    <TableCell>
                      <p className="font-medium text-foreground">{session.name}</p>
                      <p className="text-xs text-muted-foreground">{session.filename}</p>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <p className="truncate text-xs text-muted-foreground">{session.goal}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-1.5">
                        {SPECIALIST_AGENTS.filter((a) =>
                          session.routing_decision?.activated.includes(a)
                        ).map((agent) => (
                          <Tooltip key={agent}>
                            <TooltipTrigger
                              render={
                                <span className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[9px] font-medium text-primary">
                                  {AGENT_INITIALS[agent]}
                                </span>
                              }
                            />
                            <TooltipContent>{AGENT_LABELS[agent]}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(session.created_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Dialog
                        open={deletingId === session.id}
                        onOpenChange={(open) => {
                          setDeletingId(open ? session.id : null);
                          if (!open) setDeleteError(null);
                        }}
                      >
                        <DialogTrigger
                          render={
                            <Button variant="ghost" size="icon" className="size-7">
                              <Trash2 className="size-3.5 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete this session?</DialogTitle>
                            <DialogDescription>
                              This permanently deletes &ldquo;{session.name}&rdquo; and its
                              analysis results. This can&apos;t be undone.
                            </DialogDescription>
                          </DialogHeader>
                          {deleteError && (
                            <p className="text-xs text-destructive">{deleteError}</p>
                          )}
                          <DialogFooter>
                            <Button
                              variant="outline"
                              disabled={isDeleting}
                              onClick={() => setDeletingId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => handleDelete(session.id)}
                            >
                              {isDeleting ? "Deleting…" : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
