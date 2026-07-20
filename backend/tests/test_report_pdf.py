from agents.nodes.report_pdf import generate_report_pdf


def test_generate_report_pdf_produces_valid_pdf_with_full_content():
    pdf_bytes, page_count = generate_report_pdf(
        goal="Identify gaps in agentic AI research.",
        corpus_stats={"valid_count": 46, "year_min": 2015, "year_max": 2026, "skipped_count": 4},
        summaries={
            "insights_reporting": "Synthesis paragraph.",
            "bibliometric_analyst": "Trend summary.",
        },
        results={},
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
        results={},
        gap_analysis={"gaps": []},
        recommendations=[],
    )
    assert pdf_bytes[:4] == b"%PDF"
    assert page_count >= 1


def test_generate_report_pdf_embeds_bibliometric_and_science_mapping_figures():
    pdf_bytes, page_count = generate_report_pdf(
        goal="Identify gaps in agentic AI research.",
        corpus_stats={"valid_count": 3, "year_min": 2020, "year_max": 2022, "skipped_count": 0},
        summaries={
            "insights_reporting": "Synthesis paragraph.",
            "bibliometric_analyst": "Trend summary.",
            "science_mapping": "Thematic structure summary.",
        },
        results={
            "bibliometric_analyst": {
                "publication_trend": {
                    "years": [2020, 2021, 2022],
                    "publications_per_year": [1, 2, 3],
                    "citations_per_year": [5, 8, 2],
                }
            },
            "science_mapping": {
                "co_occurrence_analysis": {
                    "nodes": [
                        {"id": "a", "label": "a", "frequency": 10, "cluster": 0},
                        {"id": "b", "label": "b", "frequency": 6, "cluster": 1},
                    ],
                    "edges": [{"source": "a", "target": "b", "weight": 3}],
                }
            },
        },
        gap_analysis={"gaps": []},
        recommendations=[],
    )
    assert pdf_bytes[:4] == b"%PDF"
    assert page_count >= 1
    # A report with two full-page-width figures plus text should span more
    # than the single page the text-only fixtures above produce.
    assert page_count >= 2
