from mcp_servers.bibliometric_analysis import analysis

RECORDS = [
    {
        "id": "a",
        "title": "A",
        "author": "Smith, J. and Doe, A.",
        "journal": "J1",
        "year": 2020,
        "times_cited": 10,
    },
    {
        "id": "b",
        "title": "B",
        "author": "Smith, J.",
        "journal": "J1",
        "year": 2021,
        "times_cited": 5,
    },
    {
        "id": "c",
        "title": "C",
        "author": "Doe, A. and Lee, K.",
        "journal": "J2",
        "year": 2021,
        "times_cited": 0,
    },
]


def test_publication_trend_aggregates_by_year():
    result = analysis.publication_trend(RECORDS)
    assert result["years"] == [2020, 2021]
    assert result["publications_per_year"] == [1, 2]
    assert result["citations_per_year"] == [10, 5]
    assert result["total_publications"] == 3
    assert result["total_citations"] == 15


def test_citation_analysis_ranks_authors_and_journals():
    result = analysis.citation_analysis(RECORDS, top_n=5)
    assert result["total_citations"] == 15
    assert result["average_citations_per_paper"] == 5.0
    assert result["most_cited_papers"][0]["id"] == "a"

    top_author_names = [a["author"] for a in result["top_authors"]]
    assert top_author_names[0] == "Smith, J."  # 10 + 5 = 15, highest

    top_journal_names = [j["journal"] for j in result["top_journals"]]
    assert top_journal_names[0] == "J1"  # 10 + 5 = 15


def test_citation_analysis_handles_empty_corpus():
    result = analysis.citation_analysis([])
    assert result["total_publications"] == 0
    assert result["average_citations_per_paper"] == 0.0
    assert result["most_cited_papers"] == []
