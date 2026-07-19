import type { ScienceMappingResult, CoOccurrenceNode, GraphEdge } from "@/lib/types";
import { mulberry32 } from "@/lib/mock/prng";
import { MOCK_BIBLIOMETRIC_RESULT } from "@/lib/mock/bibliometric";

export const CLUSTER_THEMES = [
  "Agentic Planning & Reasoning",
  "Tool Use & Protocols",
  "Healthcare Applications",
  "Evaluation & Benchmarking",
] as const;

const CLUSTER_KEYWORDS: string[][] = [
  [
    "agentic ai",
    "autonomous agents",
    "multi-agent systems",
    "task decomposition",
    "long-horizon planning",
    "goal-directed behavior",
    "hierarchical planning",
    "chain-of-thought",
    "self-reflection",
    "plan execution",
  ],
  [
    "tool use",
    "model context protocol",
    "function calling",
    "tool-augmented llms",
    "api orchestration",
    "retrieval-augmented generation",
    "structured outputs",
    "tool discovery",
    "external memory",
    "plugin architectures",
  ],
  [
    "clinical decision support",
    "diagnostic imaging",
    "healthcare ai",
    "patient triage",
    "electronic health records",
    "medical question answering",
    "drug discovery",
    "clinical nlp",
    "telemedicine",
    "healthcare ethics",
  ],
  [
    "agent benchmarks",
    "evaluation metrics",
    "human-in-the-loop",
    "trust and safety",
    "hallucination detection",
    "robustness testing",
    "explainability",
    "bias evaluation",
    "reproducibility",
    "red teaming",
  ],
];

const rand = mulberry32(20260720);

const nodes: CoOccurrenceNode[] = [];
CLUSTER_KEYWORDS.forEach((keywords, clusterIdx) => {
  keywords.forEach((label, i) => {
    const baseFrequency = clusterIdx === 0 ? 260 : clusterIdx === 1 ? 190 : clusterIdx === 2 ? 150 : 120;
    const frequency = Math.round(baseFrequency * (1 - i * 0.11) * (0.85 + rand() * 0.3));
    nodes.push({ id: label, label, frequency: Math.max(8, frequency), cluster: clusterIdx });
  });
});

const edges: GraphEdge[] = [];
const clusterNodeIds = CLUSTER_KEYWORDS.map((kws) => kws);
clusterNodeIds.forEach((keywords, clusterIdx) => {
  for (let i = 0; i < keywords.length; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      // Denser edges between higher-frequency (earlier) keywords in the cluster.
      const proximity = 1 - (i + j) / (keywords.length * 2);
      if (rand() < 0.35 + proximity * 0.5) {
        const weight = Math.round(4 + rand() * 40 * proximity);
        edges.push({ source: keywords[i], target: keywords[j], weight });
      }
    }
  }
});

// Sparse cross-cluster bridge edges — the interesting "gap" signal.
const bridges: [number, number, number, number, number][] = [
  [0, 2, 0, 2, 3], // agentic ai <-> healthcare ai
  [0, 1, 0, 0, 6], // agentic ai <-> tool use
  [1, 3, 5, 1, 4], // retrieval-augmented generation <-> evaluation metrics
  [2, 3, 0, 6, 2], // clinical decision support <-> trust and safety
  [0, 3, 4, 0, 5], // long-horizon planning <-> agent benchmarks
];
for (const [ca, cb, ia, ib, weight] of bridges) {
  edges.push({
    source: CLUSTER_KEYWORDS[ca][ia],
    target: CLUSTER_KEYWORDS[cb][ib],
    weight,
  });
}

const mostCitedIds = MOCK_BIBLIOMETRIC_RESULT.citation_analysis!.most_cited_papers;
const cocitationNodes = mostCitedIds.slice(0, 8).map((p) => ({
  id: p.id,
  title: p.title,
  times_cited: p.times_cited,
}));
const cocitationEdges: GraphEdge[] = [
  { source: "chen2022agentic", target: "rahman2021multiagent", weight: 14 },
  { source: "chen2022agentic", target: "tanaka2023toolaugmented", weight: 9 },
  { source: "chen2022agentic", target: "dubois2024evaluation", weight: 6 },
  { source: "rahman2021multiagent", target: "silva2020reinforcement", weight: 11 },
  { source: "tanaka2023toolaugmented", target: "kumar2023rag", weight: 8 },
  { source: "tanaka2023toolaugmented", target: "park2023llm", weight: 12 },
  { source: "okafor2022healthcare", target: "chen2022agentic", weight: 3 },
  { source: "kumar2023rag", target: "park2023llm", weight: 7 },
];

export const MOCK_SCIENCE_MAPPING_RESULT: ScienceMappingResult = {
  co_occurrence_analysis: { nodes, edges, clusters: CLUSTER_THEMES.length },
  cocitation_analysis: { nodes: cocitationNodes, edges: cocitationEdges },
};
