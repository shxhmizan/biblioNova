"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AcquisitionCandidate } from "@/lib/types";

export function PaperReviewList({
  candidates,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
}: {
  candidates: AcquisitionCandidate[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  const allSelected = candidates.length > 0 && selected.size === candidates.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={(checked) => (checked ? onSelectAll() : onSelectNone())}
            aria-label="Select all papers"
          />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{selected.size}</span> of{" "}
            {candidates.length} selected
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-7 text-xs">
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={onSelectNone} className="h-7 text-xs">
            Select none
          </Button>
        </div>
      </div>

      <div className="max-h-[30rem] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Source</TableHead>
              <TableHead className="w-16 text-right">Year</TableHead>
              <TableHead className="w-20 text-right">Citations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => {
              const isSelected = selected.has(c.bibtex_key);
              return (
                <TableRow
                  key={c.bibtex_key}
                  className="cursor-pointer"
                  onClick={() => onToggle(c.bibtex_key)}
                  aria-selected={isSelected}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(c.bibtex_key)}
                      aria-label={`Select ${c.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{c.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {c.authors.length ? c.authors.join(", ") : "Authors not listed"}
                      {c.venue ? ` · ${c.venue}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="uppercase">
                        {c.source}
                      </Badge>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Open source page"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular text-xs">
                    {c.year ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular text-xs">
                    {c.times_cited}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
