"""Builds the downloadable PDF report from a session's analysis results.

Deterministic — no LLM involved here, just laying out already-computed data.
"""

import io

from pypdf import PdfReader
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from agents.nodes.report_figures import (
    citations_bar_figure,
    co_occurrence_network_figure,
    publication_trend_figure,
)

_STYLES = getSampleStyleSheet()

_CONFIDENCE_LABEL = {"high": "High confidence", "medium": "Medium confidence"}


def _figure_image(png_bytes: bytes | None, width_in: float, height_in: float) -> Image | None:
    if png_bytes is None:
        return None
    return Image(io.BytesIO(png_bytes), width=width_in * inch, height=height_in * inch)


def generate_report_pdf(
    *,
    goal: str,
    corpus_stats: dict,
    summaries: dict[str, str],
    results: dict,
    gap_analysis: dict,
    recommendations: list[dict],
) -> tuple[bytes, int]:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, title="BiblioAgent Analysis Report")
    story = []

    story.append(Paragraph("BiblioAgent Analysis Report", _STYLES["Title"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(f"<b>Research goal:</b> {goal}", _STYLES["BodyText"]))
    story.append(
        Paragraph(
            f"<b>Corpus:</b> {corpus_stats.get('valid_count', 0)} records "
            f"({corpus_stats.get('year_min')}–{corpus_stats.get('year_max')}), "
            f"{corpus_stats.get('skipped_count', 0)} skipped during parsing.",
            _STYLES["BodyText"],
        )
    )
    story.append(Spacer(1, 0.2 * inch))

    if "insights_reporting" in summaries:
        story.append(Paragraph("Executive Summary", _STYLES["Heading1"]))
        story.append(Paragraph(summaries["insights_reporting"], _STYLES["BodyText"]))
        story.append(Spacer(1, 0.2 * inch))

    specialist_titles = {
        "bibliometric_analyst": "Bibliometric Analysis",
        "science_mapping": "Science Mapping",
        "text_mining": "Semantic Clustering",
    }
    for agent_name, title in specialist_titles.items():
        if agent_name not in summaries:
            continue
        story.append(Paragraph(title, _STYLES["Heading1"]))
        story.append(Paragraph(summaries[agent_name], _STYLES["BodyText"]))
        story.append(Spacer(1, 0.1 * inch))

        if agent_name == "bibliometric_analyst":
            trend = results.get("bibliometric_analyst", {}).get("publication_trend")
            if trend and trend.get("years"):
                pub_image = _figure_image(
                    publication_trend_figure(trend["years"], trend["publications_per_year"]), 5, 2.5
                )
                cite_image = _figure_image(
                    citations_bar_figure(trend["years"], trend["citations_per_year"]), 5, 2.5
                )
                if pub_image:
                    story.append(pub_image)
                    story.append(Spacer(1, 0.1 * inch))
                if cite_image:
                    story.append(cite_image)

        if agent_name == "science_mapping":
            co_occurrence = results.get("science_mapping", {}).get("co_occurrence_analysis")
            if co_occurrence and co_occurrence.get("nodes"):
                network_image = _figure_image(
                    co_occurrence_network_figure(co_occurrence["nodes"], co_occurrence["edges"]),
                    5.6,
                    4.5,
                )
                if network_image:
                    story.append(network_image)

        story.append(Spacer(1, 0.15 * inch))

    gaps = gap_analysis.get("gaps", [])
    story.append(Paragraph("Research Gaps", _STYLES["Heading1"]))
    if not gaps:
        story.append(Paragraph("No research gaps were identified.", _STYLES["BodyText"]))
    for i, gap in enumerate(gaps, start=1):
        story.append(Paragraph(f"{i}. {gap['title']}", _STYLES["Heading3"]))
        confidence_label = _CONFIDENCE_LABEL.get(gap["confidence"], gap["confidence"])
        story.append(Paragraph(f"{gap['evidence']} ({confidence_label})", _STYLES["BodyText"]))
        if gap.get("supporting_record_ids"):
            story.append(
                Paragraph(
                    f"<i>Supporting records:</i> {', '.join(gap['supporting_record_ids'])}",
                    _STYLES["BodyText"],
                )
            )
        story.append(Spacer(1, 0.1 * inch))

    story.append(Paragraph("Recommended Future Research", _STYLES["Heading1"]))
    if not recommendations:
        story.append(Paragraph("No recommendations were generated.", _STYLES["BodyText"]))
    else:
        rows = [["Topic", "Rationale", "Suggested methodology"]]
        for rec in recommendations:
            rows.append(
                [
                    Paragraph(rec["topic"], _STYLES["BodyText"]),
                    Paragraph(rec["rationale"], _STYLES["BodyText"]),
                    Paragraph(rec["suggested_methodology"], _STYLES["BodyText"]),
                ]
            )
        table = Table(rows, colWidths=[1.6 * inch, 2.4 * inch, 2.4 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, "#999999"),
                    ("BACKGROUND", (0, 0), (-1, 0), "#e5e5e5"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(table)

    doc.build(story)

    pdf_bytes = buffer.getvalue()
    page_count = len(PdfReader(io.BytesIO(pdf_bytes)).pages)
    return pdf_bytes, page_count
