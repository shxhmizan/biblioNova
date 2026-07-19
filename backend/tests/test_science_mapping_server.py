from mcp_servers.science_mapping import analysis

RECORDS_WITH_KEYWORDS = [
    {
        "id": "a",
        "title": "A",
        "keywords": "agentic AI; LLM; healthcare",
        "times_cited": 5,
        "cited_references": [],
    },
    {
        "id": "b",
        "title": "B",
        "keywords": "agentic AI; multi-agent systems",
        "times_cited": 2,
        "cited_references": [],
    },
    {
        "id": "c",
        "title": "C",
        "keywords": "LLM; healthcare",
        "times_cited": 1,
        "cited_references": [],
    },
]


def test_co_occurrence_filters_by_min_frequency():
    result = analysis.co_occurrence_analysis(RECORDS_WITH_KEYWORDS, min_frequency=2)
    node_ids = {n["id"] for n in result["nodes"]}
    assert node_ids == {
        "agentic ai",
        "llm",
        "healthcare",
    }  # "multi-agent systems" appears once, filtered out


def test_co_occurrence_returns_empty_when_nothing_meets_threshold():
    result = analysis.co_occurrence_analysis(RECORDS_WITH_KEYWORDS, min_frequency=10)
    assert result == {"nodes": [], "edges": [], "clusters": 0}


def test_cocitation_returns_note_when_no_reference_data():
    records = [{"id": "a", "title": "A", "cited_references": []}]
    result = analysis.cocitation_analysis(records)
    assert result["nodes"] == []
    assert "note" in result


def test_cocitation_builds_network_from_shared_citing_papers():
    records = [
        {"id": "a", "title": "A", "times_cited": 5, "cited_references": []},
        {"id": "b", "title": "B", "times_cited": 2, "cited_references": []},
        {"id": "c", "title": "C", "times_cited": 1, "cited_references": ["a", "b"]},
    ]
    result = analysis.cocitation_analysis(records)
    assert {n["id"] for n in result["nodes"]} == {"a", "b"}
    assert result["edges"] == [{"source": "a", "target": "b", "weight": 1}]


def test_cocitation_ignores_references_outside_corpus():
    records = [
        {"id": "a", "title": "A", "times_cited": 5, "cited_references": ["not_in_corpus"]},
    ]
    result = analysis.cocitation_analysis(records)
    assert result["nodes"] == []
    assert "note" in result
