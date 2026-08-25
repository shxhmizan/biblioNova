"use client";

import * as React from "react";
import { use } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionNav } from "@/components/section-nav";
import { StatCard } from "@/components/stat-card";
import { GapCard } from "@/components/gap-card";
import { ClusterCard } from "@/components/cluster-card";
import { RecommendationCard } from "@/components/recommendation-card";
import { NotRunPlaceholder } from "@/components/not-run-placeholder";
import { NetworkGraph } from "@/components/network-graph";
import { CollaborationSection } from "@/components/collaboration-section";
import { WordCloud } from "@/components/word-cloud";
import { ChatDrawer } from "@/components/chat-drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardTour, type TourStep } from "@/components/onboarding/dashboard-tour";
import { McpLogLine } from "@/components/mcp-log-line";
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
import { assignClustersByComponent } from "@/lib/graph-cluster";
import { api } from "@/lib/api";
import type {
  AgentEvent,
  AnalysisResult,
  BibliometricAnalystResult,
  CocitationAnalysis,
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
  { id: "activity-log", label: "Activity Log" },
] as const;

const TOUR_STEPS: TourStep[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Corpus stats and the Coordinator's executive summary, at a glance.",
  },
  {
    id: "trends",
    title: "Publication trends",
    description:
      "Publications and citations per year, plus top authors and journals — shown only if the Bibliometric Analyst was activated for your goal.",
  },
  {
    id: "science-mapping",
    title: "Science mapping",
    description:
      "Interactive keyword co-occurrence and co-citation networks. Drag nodes, scroll to zoom, and hover for detail.",
  },
  {
    id: "clusters",
    title: "Semantic clusters",
    description:
      "GMM clusters over sentence embeddings, plus a keyword-frequency word cloud, if Text Mining ran.",
  },
  {
    id: "gaps",
    title: "Research gaps",
    description:
      "Gaps the Insights & Reporting agent identified, each backed by evidence and a confidence rating.",
  },
  {
    id: "recommendations",
    title: "Recommendations",
    description: "Future research topics the Research Advisor mapped 1:1 to each gap.",
  },
  {
    id: "report",
    title: "Report",
    description: "Download the full PDF — goal, findings, gaps, and recommendations in one document.",
  },
  {
    id: "activity-log",
    title: "Activity log",
    description: "Every agent transition and MCP tool call made during this run, for full transparency.",
  },
];

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { resolvedTheme } = useTheme();
  const mode: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";

  const [session, setSession] = React.useState<SessionDetail | null>(null);
  const [results, setResults] = React.useState<AnalysisResult[]>([]);
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [logOpen, setLogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([api.getSession(id), api.getSessionResults(id), api.getSessionEvents(id)]).then(
      ([s, r, e]) => {
        setSession(s);
        setResults(r);
        setEvents(e);
        setLoading(false);
      }
    );
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
        right={<DashboardTour steps={TOUR_STEPS} />}
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

              {bibliometric.coauthorship_network_analysis && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Collaboration
                  </h3>
                  <CollaborationSection
                    data={bibliometric.coauthorship_network_analysis}
                    mode={mode}
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
            (() => {
              const networkTabs = [
                scienceMapping.co_occurrence_analysis && {
                  value: "co_occurrence",
                  label: "Co-occurrence",
                },
                scienceMapping.cocitation_analysis && { value: "cocitation", label: "Co-citation" },
                scienceMapping.bibliographic_coupling_analysis && {
                  value: "coupling",
                  label: "Bibliographic coupling",
                },
              ].filter((t): t is { value: string; label: string } => Boolean(t));

              if (networkTabs.length === 0) return null;

              return (
                <Tabs defaultValue={networkTabs[0].value}>
                  <TabsList>
                    {networkTabs.map((t) => (
                      <TabsTrigger key={t.value} value={t.value}>
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {scienceMapping.co_occurrence_analysis && (
                    <TabsContent value="co_occurrence">
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
                    </TabsContent>
                  )}
                  {scienceMapping.cocitation_analysis && (
                    <TabsContent value="cocitation">
                      <PaperNetworkView data={scienceMapping.cocitation_analysis} mode={mode} />
                    </TabsContent>
                  )}
                  {scienceMapping.bibliographic_coupling_analysis && (
                    <TabsContent value="coupling">
                      <PaperNetworkView
                        data={scienceMapping.bibliographic_coupling_analysis}
                        mode={mode}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              );
            })()
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
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Keyword frequency
                </h3>
                <WordCloud clusters={textMining.clusters} mode={mode} />
              </div>
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

        {/* Activity Log — the full persisted event trace (agent starts/skips/
            completions plus every genuine MCP tools/list & tools/call), kept
            around after the run finishes since it's also the thesis
            evaluation data, not just a live-progress artifact. */}
        <section id="activity-log" className="scroll-mt-16 space-y-4">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <div className="rounded-lg border bg-card">
            <button
              onClick={() => setLogOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground"
            >
              {events.length} event{events.length === 1 ? "" : "s"} recorded for this session
              {logOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {logOpen && (
              <div className="max-h-96 space-y-1 overflow-y-auto border-t px-4 py-3">
                {events.map((event, i) => (
                  <McpLogLine key={i} event={event} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ChatDrawer sessionId={id} suggestedQuestions={MOCK_CHAT_PAIRS.map((p) => p.question)} />
    </div>
  );
}

// Shared by co-citation and bibliographic coupling — both are paper-to-paper
// networks with the identical {nodes, edges, note?} shape and neither carries
// semantic cluster labels from its MCP tool, so both are clustered from the
// network's own structure, same as VOSviewer does.
function PaperNetworkView({
  data,
  mode,
}: {
  data: CocitationAnalysis;
  mode: "light" | "dark";
}) {
  if (data.note) {
    return <NotRunPlaceholder reason={data.note} />;
  }
  const clusterByNode = assignClustersByComponent(data.nodes, data.edges);
  const clusterCount = new Set(clusterByNode.values()).size;
  return (
    <NetworkGraph
      mode={mode}
      clusterLabels={Array.from({ length: clusterCount }, (_, i) => `Cluster ${i + 1}`)}
      nodes={data.nodes.map((n) => ({
        id: n.id,
        label: n.title,
        value: n.times_cited || 1,
        cluster: clusterByNode.get(n.id) ?? 0,
      }))}
      links={data.edges}
    />
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
