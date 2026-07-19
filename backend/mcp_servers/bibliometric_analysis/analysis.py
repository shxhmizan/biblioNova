"""Core analysis functions for the bibliometric-analysis-server."""

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


def citation_analysis(records: list[dict], top_n: int = 10) -> dict:
    """Citation totals plus author/journal rankings by citation count.

    Covers citation analysis and author/journal rankings within this single
    tool, matching the two-tool contract locked in for this server.
    """
    total_publications = len(records)
    total_citations = sum(r.get("times_cited", 0) or 0 for r in records)
    average_citations = (
        round(total_citations / total_publications, 2) if total_publications else 0.0
    )

    most_cited = sorted(records, key=lambda r: r.get("times_cited", 0) or 0, reverse=True)[:top_n]
    most_cited_papers = [
        {
            "id": r["id"],
            "title": r["title"],
            "year": r.get("year"),
            "times_cited": r.get("times_cited", 0) or 0,
        }
        for r in most_cited
    ]

    author_citations: Counter[str] = Counter()
    author_papers: Counter[str] = Counter()
    journal_citations: Counter[str] = Counter()
    journal_papers: Counter[str] = Counter()

    for r in records:
        cited = r.get("times_cited", 0) or 0

        for name in r.get("author", "").split(" and "):
            name = name.strip()
            if name:
                author_citations[name] += cited
                author_papers[name] += 1

        journal = r.get("journal", "").strip()
        if journal:
            journal_citations[journal] += cited
            journal_papers[journal] += 1

    top_authors = [
        {"author": name, "total_citations": cites, "publication_count": author_papers[name]}
        for name, cites in author_citations.most_common(top_n)
    ]
    top_journals = [
        {"journal": name, "total_citations": cites, "publication_count": journal_papers[name]}
        for name, cites in journal_citations.most_common(top_n)
    ]

    return {
        "total_publications": total_publications,
        "total_citations": total_citations,
        "average_citations_per_paper": average_citations,
        "most_cited_papers": most_cited_papers,
        "top_authors": top_authors,
        "top_journals": top_journals,
    }
