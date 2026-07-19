from agents.nodes.report_pdf import generate_report_pdf


def test_generate_report_pdf_produces_valid_pdf_with_full_content():
    pdf_bytes, page_count = generate_report_pdf(
        goal="Identify gaps in agentic AI research.",
        corpus_stats={"valid_count": 46, "year_min": 2015, "year_max": 2026, "skipped_count": 4},
        summaries={
            "insights_reporting": "Synthesis paragraph.",
            "bibliometric_analyst": "Trend summary.",
        },
        gap_analysis={
            "gaps": [
                {
                    "title": "Gap 1",
                    "evidence": "Only 3 of 46 papers address this.",
                    "confidence": "high",
                    "supporting_record_ids": ["a", "b"],
                }
            ]
        },
        recommendations=[
            {"topic": "Study X", "rationale": "Because Y", "suggested_methodology": "RCT"}
        ],
    )
    assert pdf_bytes[:4] == b"%PDF"
    assert page_count >= 1


def test_generate_report_pdf_handles_no_gaps_or_recommendations():
    pdf_bytes, page_count = generate_report_pdf(
        goal="Some goal.",
        corpus_stats={"valid_count": 0, "year_min": None, "year_max": None, "skipped_count": 0},
        summaries={},
        gap_analysis={"gaps": []},
        recommendations=[],
    )
    assert pdf_bytes[:4] == b"%PDF"
    assert page_count >= 1
