"""Core analysis functions for the bibliometric-analysis-server.

Phase 1 implements publication_trend() only, enough for the Bibliometric
Analyst round trip. citation_analysis() and author/journal rankings are
added in Phase 2.
"""

from collections import Counter


def publication_trend(records: list[dict]) -> dict:
    """Publications and citations per year for a corpus of parsed BibTeX records."""
    pubs_by_year: Counter[int] = Counter()
    citations_by_year: Counter[int] = Counter()

    for record in records:
        year = record.get("year")
        if not year:
            continue
        pubs_by_year[year] += 1
        citations_by_year[year] += record.get("times_cited", 0) or 0

    years = sorted(pubs_by_year)
    return {
        "years": years,
        "publications_per_year": [pubs_by_year[y] for y in years],
        "citations_per_year": [citations_by_year[y] for y in years],
        "total_publications": sum(pubs_by_year.values()),
        "total_citations": sum(citations_by_year.values()),
        "year_range": [years[0], years[-1]] if years else None,
    }
