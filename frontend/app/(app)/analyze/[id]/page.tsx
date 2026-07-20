"use client";

import * as React from "react";
import { use } from "react";
import { useTheme } from "next-themes";
import { BarChart3, BookOpen, CalendarRange, Download, FileText, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionNav } from "@/components/section-nav";
import { StatCard } from "@/components/stat-card";
import { GapCard } from "@/components/gap-card";
import { ClusterCard } from "@/components/cluster-card";
import { RecommendationCard } from "@/components/recommendation-card";
import { NotRunPlaceholder } from "@/components/not-run-placeholder";
import { NetworkGraph } from "@/components/network-graph";
import { ChatDrawer } from "@/components/chat-drawer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PublicationTrendChart,
  CitationsBarChart,
} from "@/components/charts/publication-trend-chart";
import { ClusterScatterChart } from "@/components/charts/cluster-scatter-chart";
import { generateScatterPoints } from "@/lib/mock/clusters";
import { CLUSTER_THEMES as SCIENCE_MAPPING_CLUSTER_LABELS } from "@/lib/mock/network";
import { MOCK_CHAT_PAIRS } from "@/lib/mock/chat";
import { api } from "@/lib/api";
import type {
  AnalysisResult,
  BibliometricAnalystResult,
  InsightsReportingResult,
  ResearchAdvisorResult,
  ScienceMappingResult,
  SessionDetail,
  TextMiningResult,
} from "@/lib/types";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Publication Trends", agent: "bibliometric_analyst" },
  { id: "science-mapping", label: "Science Mapping", agent: "science_mapping" },
  { id: "clusters", label: "Semantic Clusters", agent: "text_mining" },
  { id: "gaps", label: "Research Gaps" },
  { id: "recommendations", label: "Recommendations" },
  { id: "report", label: "Report" },
] as const;

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { resolvedTheme } = useTheme();
  const mode: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";

  const [session, setSession] = React.useState<SessionDetail | null>(null);
  const [results, setResults] = React.useState<AnalysisResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([api.getSession(id), api.getSessionResults(id)]).then(([s, r]) => {
      setSession(s);
      setResults(r);
      setLoading(false);
    });
  }, [id]);

  if (loading || !session) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const activated = new Set(session.routing_decision?.activated ?? []);
  const resultByAgent = Object.fromEntries(results.map((r) => [r.agent_name, r.result_json]));
  const bibliometric = resultByAgent.bibliometric_analyst as BibliometricAnalystResult | undefined;
  const scienceMapping = resultByAgent.science_mapping as ScienceMappingResult | undefined;
  const textMining = resultByAgent.text_mining as TextMiningResult | undefined;
  const insights = resultByAgent.insights_reporting as InsightsReportingResult | undefined;
  const advisor = resultByAgent.research_advisor as ResearchAdvisorResult | undefined;

  const gapById = new Map((insights?.gaps ?? []).map((g) => [g.id, g]));
  const reportUrl = api.getReportUrl(id);

  async function handleRename(name: string) {
    const updated = await api.renameSession(id, name);
    setSession(updated);
  }

  return (
    <div className="pb-16">
      <Topbar
        breadcrumb={[{ label: "Sessions", href: "/sessions" }]}
        sessionName={session.name}
        onSessionNameChange={handleRename}
        status={session.status}
      />
      <SectionNav
        items={SECTIONS.map((s) => ({
          id: s.id,
          label: s.label,
          disabled: "agent" in s && !activated.has(s.agent),
        }))}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-6">
        {/* Overview */}
        <section id="overview" className="scroll-mt-16 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard
              label="Publications"
              value={session.corpus_stats.valid_count.toLocaleString()}
              icon={BookOpen}
            />
            {bibliometric?.citation_analysis && (
              <>
                <StatCard
                  label="Citations"
                  value={bibliometric.citation_analysis.total_citations.toLocaleString()}
                  icon={BarChart3}
                />
                <StatCard
                  label="Avg. citations/paper"
                  value={bibliometric.citation_analysis.average_citations_per_paper.toFixed(1)}
                  icon={BarChart3}
                />
              </>
            )}
            <StatCard
              label="Active years"
              value={
                session.corpus_stats.year_min && session.corpus_stats.year_max
                  ? `${session.corpus_stats.year_min}–${session.corpus_stats.year_max}`
                  : "—"
              }
              icon={CalendarRange}
            />
            <StatCard
              label="Unique authors"
              value={session.corpus_stats.unique_authors.toLocaleString()}
              icon={Users}
            />
          </div>
          {session.executive_summary && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium text-foreground">Executive Summary</h2>
              <p className="text-sm text-muted-foreground">{session.executive_summary}</p>
            </div>
          )}
        </section>

        {/* Publication Trends */}
        <section id="trends" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Publication Trends</h2>
          {!activated.has("bibliometric_analyst") || !bibliometric ? (
            <NotRunPlaceholder
              reason={session.routing_decision?.skipped.find(
                (s) => s.agent === "bibliometric_analyst"
              )?.reason}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {bibliometric.publication_trend && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Publications per year
                    </h3>
                    <PublicationTrendChart
                      years={bibliometric.publication_trend.years}
                      values={bibliometric.publication_trend.publications_per_year}
                      mode={mode}
                    />
                  </div>
                )}
                {bibliometric.publication_trend && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Citations per year
                    </h3>
                    <CitationsBarChart
                      years={bibliometric.publication_trend.years}
                      values={bibliometric.publication_trend.citations_per_year}
                      mode={mode}
                    />
                  </div>
                )}
              </div>

              {bibliometric.citation_analysis && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <RankTable
                    title="Top authors"
                    rows={bibliometric.citation_analysis.top_authors.map((a) => ({
                      name: a.author,
                      citations: a.total_citations,
                      count: a.publication_count,
                    }))}
                  />
                  <RankTable
                    title="Top journals"
                    rows={bibliometric.citation_analysis.top_journals.map((j) => ({
                      name: j.journal,
                      citations: j.total_citations,
                      count: j.publication_count,
                    }))}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Science Mapping */}
        <section id="science-mapping" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Science Mapping</h2>
          {!activated.has("science_mapping") || !scienceMapping ? (
            <NotRunPlaceholder
              reason={
                session.routing_decision?.skipped.find((s) => s.agent === "science_mapping")
                  ?.reason
              }
            />
          ) : (
            <div className="space-y-6">
              {scienceMapping.co_occurrence_analysis && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Keyword co-occurrence network
                  </h3>
                  <NetworkGraph
                    mode={mode}
                    clusterLabels={[...SCIENCE_MAPPING_CLUSTER_LABELS]}
                    nodes={scienceMapping.co_occurrence_analysis.nodes.map((n) => ({
                      id: n.id,
                      label: n.label,
                      value: n.frequency,
                      cluster: n.cluster,
                    }))}
                    links={scienceMapping.co_occurrence_analysis.edges}
                  />
                </div>
              )}
              {scienceMapping.cocitation_analysis && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Co-citation network
                  </h3>
                  {scienceMapping.cocitation_analysis.note ? (
                    <NotRunPlaceholder reason={scienceMapping.cocitation_analysis.note} />
                  ) : (
                    <NetworkGraph
                      mode={mode}
                      nodes={scienceMapping.cocitation_analysis.nodes.map((n) => ({
                        id: n.id,
                        label: n.title,
                        value: n.times_cited || 1,
                        cluster: 0,
                      }))}
                      links={scienceMapping.cocitation_analysis.edges}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Semantic Clusters */}
        <section id="clusters" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Semantic Clusters</h2>
          {!activated.has("text_mining") || !textMining ? (
            <NotRunPlaceholder
              reason={
                session.routing_decision?.skipped.find((s) => s.agent === "text_mining")?.reason
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Embedding space (2D projection)
                </h3>
                <ClusterScatterChart
                  points={generateScatterPoints(30)}
                  clusterLabels={textMining.clusters.map((c) => c.label)}
                  mode={mode}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {textMining.clusters.map((cluster) => (
                  <ClusterCard key={cluster.cluster_id} cluster={cluster} mode={mode} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Research Gaps */}
        <section id="gaps" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Research Gaps</h2>
          {!insights ? (
            <NotRunPlaceholder />
          ) : (
            <div className="space-y-3">
              {insights.gaps.map((gap, i) => (
                <GapCard key={gap.id} gap={gap} index={i + 1} />
              ))}
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section id="recommendations" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Recommended Future Research</h2>
          {!advisor ? (
            <NotRunPlaceholder />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {advisor.recommendations.map((rec, i) => (
                <RecommendationCard
                  key={i}
                  recommendation={rec}
                  gapTitle={gapById.get(rec.addresses_gap_id)?.title}
                />
              ))}
            </div>
          )}
        </section>

        {/* Report */}
        <section id="report" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Report</h2>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <FileText className="size-6" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {session.name || "Analysis Report"}.pdf
              </p>
              <p className="text-xs text-muted-foreground">
                Goal, corpus summary, executive summary, per-specialist findings, gaps, and
                recommendations
              </p>
            </div>
            {reportUrl ? (
              <Button nativeButton={false} render={<a href={reportUrl} download />}>
                <Download className="size-4" />
                Download
              </Button>
            ) : (
              <Button disabled title="Report generation requires the live backend">
                <Download className="size-4" />
                Download
              </Button>
            )}
          </div>
        </section>
      </div>

      <ChatDrawer sessionId={id} suggestedQuestions={MOCK_CHAT_PAIRS.map((p) => p.question)} />
    </div>
  );
}

function RankTable({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; citations: number; count: number }[];
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Papers</TableHead>
            <TableHead className="text-right">Citations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 10).map((row) => (
            <TableRow key={row.name}>
              <TableCell className="max-w-40 truncate text-xs">{row.name}</TableCell>
              <TableCell className="text-right font-mono-tabular text-xs">{row.count}</TableCell>
              <TableCell className="text-right font-mono-tabular text-xs">
                {row.citations.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
