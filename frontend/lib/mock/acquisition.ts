import type { AcquisitionCandidate } from "@/lib/types";

const TITLES: [string, "openalex" | "arxiv"][] = [
  ["Autonomous Agentic Systems: A Framework for Goal-Directed Task Decomposition", "openalex"],
  ["A Survey of Collaborative Multi-Agent Systems in Distributed Decision Support", "openalex"],
  ["Tool-Augmented Large Language Models for Complex Reasoning", "arxiv"],
  ["Explainable AI Approaches for Clinical Diagnostic Support", "openalex"],
  ["Retrieval-Augmented Generation for Domain-Specific Question Answering", "arxiv"],
  ["A Taxonomy of Tool-Calling Behaviors in Language Model Agents", "arxiv"],
  ["Coordination Strategies in Multi-Agent Reinforcement Learning", "openalex"],
  ["Benchmarking Long-Horizon Planning in LLM-Based Agents", "arxiv"],
  ["Agentic Workflows for Automated Scientific Literature Review", "openalex"],
  ["Self-Reflective Agents: Iterative Refinement via Critique Loops", "arxiv"],
  ["Model Context Protocol: Standardizing Tool Discovery for AI Agents", "arxiv"],
  ["Agentic AI in Financial Services: Risk, Compliance, and Automation", "openalex"],
  ["Hierarchical Task Networks for Autonomous Agent Planning", "openalex"],
  ["Human-in-the-Loop Evaluation of Multi-Agent Healthcare Assistants", "openalex"],
  ["Scaling Tool Orchestration Across Heterogeneous MCP Servers", "arxiv"],
  ["A Comparative Study of Agent Memory Architectures", "arxiv"],
  ["Trust and Safety Considerations for Autonomous Research Agents", "openalex"],
  ["Semantic Clustering of Scientific Abstracts via Sentence Embeddings", "openalex"],
  ["Gap Analysis Automation in Bibliometric Research Pipelines", "openalex"],
  ["Co-Citation Networks as Signals for Emerging Research Fronts", "openalex"],
  ["Agentic Approaches to Automated Systematic Reviews", "arxiv"],
  ["Reasoning Under Uncertainty in Tool-Using Language Model Agents", "arxiv"],
  ["Bibliographic Coupling and the Structure of AI Subfields", "openalex"],
  ["Cross-Institutional Collaboration Patterns in Agentic AI Research", "openalex"],
  ["Evaluating Agent Autonomy: Metrics Beyond Task Completion", "arxiv"],
];

const AUTHOR_POOL = [
  "Chen, L.",
  "Rahman, S. A.",
  "Okafor, N.",
  "Tanaka, H.",
  "Kumar, P.",
  "Silva, M. F.",
  "Park, J. H.",
  "Dubois, C.",
  "Novak, T.",
  "Ibrahim, N.",
  "Garcia, R.",
  "Wang, X.",
];

function pickAuthors(seed: number): string[] {
  const count = 1 + (seed % 3);
  return Array.from({ length: count }, (_, i) => AUTHOR_POOL[(seed + i * 3) % AUTHOR_POOL.length]);
}

function bibtexKey(title: string, year: number, authors: string[]): string {
  const lastName = authors[0]?.split(",")[0]?.toLowerCase().replace(/[^a-z]/g, "") || "unknown";
  const word = title.toLowerCase().match(/[a-z]{4,}/)?.[0] ?? "paper";
  return `${lastName}${year}${word}`;
}

export const MOCK_SEARCH_CANDIDATES: AcquisitionCandidate[] = TITLES.map(([title, source], i) => {
  const year = 2019 + (i % 8);
  const authors = pickAuthors(i);
  const venue = source === "arxiv" ? "arXiv" : "Journal of Artificial Intelligence Research";
  const doi = source === "openalex" ? `10.1234/biblio.${1000 + i}` : "";
  const key = bibtexKey(title, year, authors);
  const timesCited = source === "arxiv" ? 0 : Math.max(1, 180 - i * 7);

  return {
    source,
    source_id: source === "arxiv" ? `http://arxiv.org/abs/23${String(i).padStart(2, "0")}.0000${i}` : `https://openalex.org/W${1000 + i}`,
    title,
    authors,
    year,
    venue,
    abstract:
      "We investigate agentic AI systems and their application to complex, multi-step research and decision-making tasks, presenting empirical results across several benchmark settings.",
    doi,
    times_cited: timesCited,
    is_oa: source === "arxiv" ? true : i % 3 !== 0,
    url:
      source === "arxiv"
        ? `http://arxiv.org/abs/23${String(i).padStart(2, "0")}.0000${i}`
        : `https://openalex.org/W${1000 + i}`,
    bibtex_key: key,
    bibtex_entry: `@article{${key},\n  author = {${authors.join(" and ")}},\n  title = {${title}},\n  journal = {${venue}},\n  year = {${year}},\n${doi ? `  doi = {${doi}},\n` : ""}}`,
  };
});
