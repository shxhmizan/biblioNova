import type { InsightsReportingResult, ResearchAdvisorResult } from "@/lib/types";
import { MOCK_EXECUTIVE_SUMMARY } from "@/lib/mock/corpus";

export const MOCK_INSIGHTS_RESULT: InsightsReportingResult = {
  executive_summary: MOCK_EXECUTIVE_SUMMARY,
  gaps: [
    {
      id: "gap-1",
      title: "Long-horizon multi-agent coordination in clinical care is barely studied",
      evidence:
        "Only 19 of 1,247 papers combine the 'healthcare applications' and 'agentic planning' clusters directly, versus 268 healthcare papers and 412 planning papers overall — the intersection is far smaller than either cluster alone would predict.",
      confidence: "high",
      supporting_record_ids: ["okafor2022healthcare", "chen2022agentic"],
    },
    {
      id: "gap-2",
      title: "Evaluation methodology lags capability development in high-stakes domains",
      evidence:
        "The 'Evaluation, Safety & Trust' cluster (198 papers) grew far more slowly than the 'LLM Agent Planning & Tool Use' cluster (412 papers) since 2022, and only 7 of the 198 evaluation papers specifically target healthcare or clinical settings.",
      confidence: "high",
      supporting_record_ids: ["dubois2024evaluation", "okafor2022healthcare"],
    },
    {
      id: "gap-3",
      title: "Tool-use protocols are rarely evaluated for clinical safety guarantees",
      evidence:
        "The 'Tool Use & Protocols' and 'Healthcare Applications' keyword clusters share only a single weak bridge edge (weight 3) in the co-occurrence network, the sparsest cross-cluster connection observed.",
      confidence: "medium",
      supporting_record_ids: ["tanaka2023toolaugmented"],
    },
    {
      id: "gap-4",
      title: "2025–2026 publication activity suggests the field is shifting faster than evaluation frameworks can track",
      evidence:
        "Publication counts held above 190/year through 2025 while citation accumulation for 2024–2026 work remains under 5% of the corpus average — recent work is outpacing the field's ability to evaluate and cite it.",
      confidence: "medium",
      supporting_record_ids: [],
    },
  ],
};

export const MOCK_RESEARCH_ADVISOR_RESULT: ResearchAdvisorResult = {
  recommendations: [
    {
      addresses_gap_id: "gap-1",
      topic: "Multi-agent coordination frameworks for longitudinal clinical care pathways",
      rationale:
        "Directly addresses the sparse intersection between agentic planning and healthcare research by targeting multi-step, multi-provider care coordination rather than single-turn clinical QA.",
      suggested_methodology:
        "Design-based research with a simulated multi-agent care-coordination testbed, evaluated against clinician-authored care pathways using longitudinal outcome proxies.",
    },
    {
      addresses_gap_id: "gap-2",
      topic: "Domain-specific evaluation benchmarks for agentic systems in high-stakes settings",
      rationale:
        "Responds to the evaluation lag by building benchmarks specifically for healthcare-grade agentic reasoning rather than general-purpose agent capability.",
      suggested_methodology:
        "Mixed-methods benchmark construction: expert-annotated clinical scenarios paired with quantitative agent-performance metrics and qualitative failure-mode analysis.",
    },
    {
      addresses_gap_id: "gap-3",
      topic: "Safety-constrained tool-calling protocols for clinical decision support agents",
      rationale:
        "Targets the weak bridge between tool-use and healthcare clusters by formalizing safety guarantees for tool invocation in clinical contexts specifically.",
      suggested_methodology:
        "Formal verification of tool-call constraints combined with a red-teaming study against a clinical decision-support agent prototype.",
    },
    {
      addresses_gap_id: "gap-4",
      topic: "Rapid-cycle evaluation methods that track fast-moving agentic AI capability shifts",
      rationale:
        "Addresses the citation/evaluation lag for 2025–2026 work by proposing evaluation cycles fast enough to keep pace with publication velocity.",
      suggested_methodology:
        "Continuous benchmark methodology (rolling evaluation windows) validated retrospectively against the 2022–2024 capability jump observed in this corpus.",
    },
  ],
};
