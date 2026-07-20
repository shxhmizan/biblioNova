export interface MockChatPair {
  question: string;
  answer: string;
}

export const MOCK_CHAT_PAIRS: MockChatPair[] = [
  {
    question: "Which author has the strongest citation record?",
    answer:
      "Chen, L. leads with 1,842 total citations across 31 publications, ahead of Rahman, S. A. (1,590 citations, 24 publications).",
  },
  {
    question: "Summarize gap #2.",
    answer:
      "gap-2 is that evaluation methodology lags capability development in high-stakes domains: the 'Evaluation, Safety & Trust' cluster grew far more slowly than 'LLM Agent Planning & Tool Use' since 2022, and only 7 of 198 evaluation papers target healthcare specifically. Confidence: high.",
  },
  {
    question: "How many specialists were activated for this analysis?",
    answer:
      "Two of three: Bibliometric Analyst and Science Mapping. Text Mining was skipped because the goal asks about publication trends and known thematic structure, not open-ended semantic theme discovery across abstracts.",
  },
  {
    question: "What's the strongest keyword co-occurrence?",
    answer:
      "The strongest pairs are within the 'Agentic Planning & Reasoning' cluster — 'agentic ai' and 'autonomous agents' co-occur with a weight around 44, the densest edge in the network.",
  },
  {
    question: "What does the downloadable report include?",
    answer:
      "The PDF includes the research goal, corpus summary, the executive summary, a section per activated specialist, all identified research gaps with evidence and confidence, and a table of recommendations mapped to those gaps.",
  },
  {
    question: "Which recommendation addresses gap 4?",
    answer:
      "\"Rapid-cycle evaluation methods that track fast-moving agentic AI capability shifts\" addresses gap-4 — proposing continuous, rolling-window evaluation to keep pace with 2025–2026 publication velocity.",
  },
];
