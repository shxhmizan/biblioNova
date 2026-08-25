import type { BibliometricAnalystResult } from "@/lib/types";

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const PUBLICATIONS_PER_YEAR = [14, 19, 27, 38, 55, 74, 98, 151, 212, 268, 196, 95];
const CITATIONS_PER_YEAR = [448, 551, 702, 912, 1155, 1332, 1470, 1661, 1484, 1072, 392, 38];

const AUTHORS = [
  { author: "Chen, L.", total_citations: 1842, publication_count: 31 },
  { author: "Rahman, S. A.", total_citations: 1590, publication_count: 24 },
  { author: "Okafor, N.", total_citations: 1288, publication_count: 19 },
  { author: "Tanaka, H.", total_citations: 1201, publication_count: 22 },
  { author: "Kumar, P.", total_citations: 1077, publication_count: 18 },
  { author: "Silva, M. F.", total_citations: 964, publication_count: 16 },
  { author: "Park, J. H.", total_citations: 902, publication_count: 15 },
  { author: "Dubois, C.", total_citations: 815, publication_count: 14 },
  { author: "Novak, T.", total_citations: 738, publication_count: 12 },
  { author: "Ibrahim, N.", total_citations: 671, publication_count: 11 },
];

const JOURNALS = [
  { journal: "Journal of Artificial Intelligence Research", total_citations: 2104, publication_count: 87 },
  { journal: "IEEE Transactions on Neural Networks and Learning Systems", total_citations: 1876, publication_count: 64 },
  { journal: "Nature Machine Intelligence", total_citations: 1690, publication_count: 29 },
  { journal: "ACM Transactions on Intelligent Systems and Technology", total_citations: 1432, publication_count: 71 },
  { journal: "Artificial Intelligence Review", total_citations: 1198, publication_count: 48 },
  { journal: "Expert Systems with Applications", total_citations: 1054, publication_count: 93 },
  { journal: "Journal of Machine Learning Research", total_citations: 987, publication_count: 41 },
  { journal: "International Journal of Medical Informatics", total_citations: 812, publication_count: 33 },
  { journal: "ACM Computing Surveys", total_citations: 745, publication_count: 22 },
  { journal: "Knowledge-Based Systems", total_citations: 689, publication_count: 58 },
];

const MOST_CITED_PAPERS = [
  { id: "chen2022agentic", title: "Autonomous Agentic Systems: A Framework for Goal-Directed Task Decomposition", year: 2022, times_cited: 412 },
  { id: "rahman2021multiagent", title: "A Survey of Collaborative Multi-Agent Systems in Distributed Decision Support", year: 2021, times_cited: 388 },
  { id: "tanaka2023toolaugmented", title: "Tool-Augmented Large Language Models for Complex Reasoning", year: 2023, times_cited: 351 },
  { id: "okafor2022healthcare", title: "Explainable AI Approaches for Clinical Diagnostic Support", year: 2022, times_cited: 297 },
  { id: "kumar2023rag", title: "Retrieval-Augmented Generation for Domain-Specific Question Answering", year: 2023, times_cited: 264 },
  { id: "park2023llm", title: "A Taxonomy of Tool-Calling Behaviors in Language Model Agents", year: 2023, times_cited: 231 },
  { id: "silva2020reinforcement", title: "Coordination Strategies in Multi-Agent Reinforcement Learning", year: 2020, times_cited: 219 },
  { id: "dubois2024evaluation", title: "Benchmarking Long-Horizon Planning in LLM-Based Agents", year: 2024, times_cited: 178 },
];

const NO_AFFILIATION_DATA_NOTE =
  "No author affiliation data available. Standard Web of Science BibTeX exports " +
  "parsed by this system carry author names only, not institution or country " +
  "affiliations, so this level cannot be computed for this corpus.";

// Collaboration pairs among the top-cited authors — weight = shared papers.
const COAUTHOR_EDGES: { source: string; target: string; weight: number }[] = [
  { source: "Chen, L.", target: "Rahman, S. A.", weight: 9 },
  { source: "Chen, L.", target: "Tanaka, H.", weight: 5 },
  { source: "Rahman, S. A.", target: "Okafor, N.", weight: 4 },
  { source: "Tanaka, H.", target: "Kumar, P.", weight: 7 },
  { source: "Kumar, P.", target: "Park, J. H.", weight: 6 },
  { source: "Silva, M. F.", target: "Dubois, C.", weight: 3 },
  { source: "Okafor, N.", target: "Novak, T.", weight: 2 },
  { source: "Park, J. H.", target: "Ibrahim, N.", weight: 2 },
];

const coauthoredNames = new Set(COAUTHOR_EDGES.flatMap((e) => [e.source, e.target]));
const paperCountByAuthor = new Map(AUTHORS.map((a) => [a.author, a.publication_count]));

export const MOCK_BIBLIOMETRIC_RESULT: BibliometricAnalystResult = {
  publication_trend: {
    years: YEARS,
    publications_per_year: PUBLICATIONS_PER_YEAR,
    citations_per_year: CITATIONS_PER_YEAR,
    total_publications: PUBLICATIONS_PER_YEAR.reduce((a, b) => a + b, 0),
    total_citations: CITATIONS_PER_YEAR.reduce((a, b) => a + b, 0),
    year_range: [2015, 2026],
  },
  citation_analysis: {
    total_publications: PUBLICATIONS_PER_YEAR.reduce((a, b) => a + b, 0),
    total_citations: CITATIONS_PER_YEAR.reduce((a, b) => a + b, 0),
    average_citations_per_paper: 9.0,
    most_cited_papers: MOST_CITED_PAPERS,
    top_authors: AUTHORS,
    top_journals: JOURNALS,
  },
  coauthorship_network_analysis: {
    author: {
      nodes: Array.from(coauthoredNames).map((name) => ({
        id: name,
        label: name,
        paper_count: paperCountByAuthor.get(name) ?? 1,
      })),
      edges: COAUTHOR_EDGES,
    },
    // Mirrors the real backend, which cannot compute these levels either —
    // the BibTeX parser doesn't extract affiliation data (see CLAUDE.md).
    institution: { nodes: [], edges: [], note: NO_AFFILIATION_DATA_NOTE },
    country: { nodes: [], edges: [], note: NO_AFFILIATION_DATA_NOTE },
    top_collaborating_pairs: COAUTHOR_EDGES.map((e) => ({
      a: e.source,
      b: e.target,
      shared_papers: e.weight,
    })).sort((a, b) => b.shared_papers - a.shared_papers),
    international_collaboration_rate: { rate_percent: null, note: NO_AFFILIATION_DATA_NOTE },
  },
};
