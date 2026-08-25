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


def test_coauthorship_builds_author_network_from_known_pairs():
    result = analysis.coauthorship_network_analysis(RECORDS)
    author_graph = result["author"]

    node_ids = {n["id"] for n in author_graph["nodes"]}
    assert node_ids == {"Smith, J.", "Doe, A.", "Lee, K."}

    edge_pairs = {frozenset((e["source"], e["target"])): e["weight"] for e in author_graph["edges"]}
    assert edge_pairs == {
        frozenset({"Smith, J.", "Doe, A."}): 1,
        frozenset({"Doe, A.", "Lee, K."}): 1,
    }


def test_coauthorship_top_pairs_ranked_by_shared_papers():
    records = [
        {"id": "a", "author": "Smith, J. and Doe, A."},
        {"id": "b", "author": "Smith, J. and Doe, A."},
        {"id": "c", "author": "Doe, A. and Lee, K."},
    ]
    result = analysis.coauthorship_network_analysis(records, top_n=5)
    top = result["top_collaborating_pairs"]
    assert top[0]["shared_papers"] == 2
    assert {top[0]["a"], top[0]["b"]} == {"Smith, J.", "Doe, A."}


def test_coauthorship_institution_and_country_report_no_data():
    result = analysis.coauthorship_network_analysis(RECORDS)
    assert result["institution"]["nodes"] == []
    assert "note" in result["institution"]
    assert result["country"]["nodes"] == []
    assert "note" in result["country"]
    assert result["international_collaboration_rate"]["rate_percent"] is None
    assert "note" in result["international_collaboration_rate"]
