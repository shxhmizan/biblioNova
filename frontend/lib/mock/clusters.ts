import type { TextMiningResult } from "@/lib/types";
import { mulberry32 } from "@/lib/mock/prng";

const CLUSTER_DEFS = [
  {
    label: "LLM Agent Planning & Tool Use",
    size: 412,
    top_keywords: ["planning", "tool-calling", "reasoning"],
    representative_titles: [
      "Autonomous Agentic Systems: A Framework for Goal-Directed Task Decomposition",
      "Tool-Augmented Large Language Models for Complex Reasoning",
      "A Taxonomy of Tool-Calling Behaviors in Language Model Agents",
    ],
  },
  {
    label: "Healthcare & Clinical Applications",
    size: 268,
    top_keywords: ["clinical", "diagnostic", "triage"],
    representative_titles: [
      "Explainable AI Approaches for Clinical Diagnostic Support",
      "Agentic Decision Support for Patient Triage in Emergency Settings",
      "Electronic Health Record Grounding for Clinical Question Answering",
    ],
  },
  {
    label: "Multi-Agent Coordination",
    size: 231,
    top_keywords: ["coordination", "multi-agent", "collaboration"],
    representative_titles: [
      "A Survey of Collaborative Multi-Agent Systems in Distributed Decision Support",
      "Coordination Strategies in Multi-Agent Reinforcement Learning",
      "Scalable Orchestration of Specialist Agents in Analysis Pipelines",
    ],
  },
  {
    label: "Evaluation, Safety & Trust",
    size: 198,
    top_keywords: ["evaluation", "safety", "trust"],
    representative_titles: [
      "Benchmarking Long-Horizon Planning in LLM-Based Agents",
      "Trust and Transparency in Agentic AI Decision-Making Systems",
      "Human-in-the-Loop Oversight for Autonomous Agents",
    ],
  },
  {
    label: "Retrieval-Augmented & Knowledge-Grounded Agents",
    size: 138,
    top_keywords: ["retrieval", "knowledge graphs", "grounding"],
    representative_titles: [
      "Retrieval-Augmented Generation for Domain-Specific Question Answering",
      "Knowledge Graph-Grounded Agents for Enterprise Applications",
      "Grounding Agent Reasoning in Structured External Memory",
    ],
  },
];

export const MOCK_TEXT_MINING_RESULT: TextMiningResult = {
  n_clusters: CLUSTER_DEFS.length,
  clusters: CLUSTER_DEFS.map((c, i) => ({
    cluster_id: i,
    label: c.label,
    size: c.size,
    top_keywords: c.top_keywords,
    representative_titles: c.representative_titles,
    record_ids: [],
  })),
};

export interface ScatterPoint {
  x: number;
  y: number;
  cluster: number;
}

// A representative sample (not all 1,247 points) for the UMAP-style scatter —
// deterministic so SSR/client output matches exactly.
const CENTROIDS = [
  [-3.2, 2.1],
  [2.8, -2.6],
  [-2.4, -2.9],
  [3.4, 2.4],
  [0.1, 0.2],
];

export function generateScatterPoints(pointsPerCluster = 40): ScatterPoint[] {
  const rand = mulberry32(4471);
  const points: ScatterPoint[] = [];
  CENTROIDS.forEach(([cx, cy], cluster) => {
    for (let i = 0; i < pointsPerCluster; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = rand() * 1.4 + rand() * 0.4;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        cluster,
      });
    }
  });
  return points;
}
