"""Core analysis functions for the bibliometric-analysis-server."""

from collections import Counter
from itertools import combinations

_NO_AFFILIATION_DATA_NOTE = (
    "No author affiliation data available. Standard Web of Science BibTeX exports "
    "parsed by this system carry author names only, not institution or country "
    "affiliations, so this level cannot be computed for this corpus."
)


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


def coauthorship_network_analysis(records: list[dict], top_n: int = 10) -> dict:
    """Co-authorship collaboration network at author level, plus top collaborating
    pairs. Institution- and country-level graphs and the international-collaboration
    rate all require affiliation data this system's BibTeX parser does not currently
    extract, so those come back as explicit "not available" notes rather than
    fabricated results.
    """
    pair_counts: Counter[tuple[str, str]] = Counter()
    paper_counts: Counter[str] = Counter()

    for r in records:
        raw_names = r.get("author", "").split(" and ")
        authors = sorted({name.strip() for name in raw_names if name.strip()})
        for name in authors:
            paper_counts[name] += 1
        for a, b in combinations(authors, 2):
            pair_counts[(a, b)] += 1

    coauthored = {name for pair in pair_counts for name in pair}
    author_graph = {
        "nodes": [
            {"id": name, "label": name, "paper_count": paper_counts[name]} for name in coauthored
        ],
        "edges": [
            {"source": a, "target": b, "weight": count} for (a, b), count in pair_counts.items()
        ],
    }

    top_collaborating_pairs = [
        {"a": a, "b": b, "shared_papers": count} for (a, b), count in pair_counts.most_common(top_n)
    ]

    return {
        "author": author_graph,
        "institution": {"nodes": [], "edges": [], "note": _NO_AFFILIATION_DATA_NOTE},
        "country": {"nodes": [], "edges": [], "note": _NO_AFFILIATION_DATA_NOTE},
        "top_collaborating_pairs": top_collaborating_pairs,
        "international_collaboration_rate": {
            "rate_percent": None,
            "note": _NO_AFFILIATION_DATA_NOTE,
        },
    }
