import xml.etree.ElementTree as ET

from mcp_servers.data_acquisition import bibtex, sources

RECORD_A = {
    "source": "openalex",
    "source_id": "https://openalex.org/W1",
    "title": "Agentic AI for Clinical Decision Support",
    "authors": ["Chen, L.", "Doe, A."],
    "year": 2023,
    "venue": "Journal of AI Research",
    "abstract": "We study agentic AI in healthcare.",
    "doi": "10.1234/abc123",
    "times_cited": 12,
    "is_oa": True,
    "url": "https://openalex.org/W1",
}


def test_to_bibtex_dedupes_by_matching_doi():
    duplicate = {
        **RECORD_A,
        "source": "arxiv",
        "source_id": "arxiv:1",
        "title": "A different title",
    }
    result = bibtex.to_bibtex([RECORD_A, duplicate])
    assert len(result["records"]) == 1
    assert result["duplicates_removed"] == 1


def test_to_bibtex_dedupes_by_normalized_title():
    duplicate = {
        **RECORD_A,
        "doi": "",
        "source": "arxiv",
        "title": "  Agentic AI for Clinical Decision Support!! ",
    }
    result = bibtex.to_bibtex([RECORD_A, duplicate])
    assert len(result["records"]) == 1
    assert result["duplicates_removed"] == 1


def test_to_bibtex_keeps_genuinely_distinct_records():
    other = {**RECORD_A, "doi": "10.5678/xyz789", "title": "A Survey of Multi-Agent Systems"}
    result = bibtex.to_bibtex([RECORD_A, other])
    assert len(result["records"]) == 2
    assert result["duplicates_removed"] == 0


def test_to_bibtex_assigns_unique_keys_on_collision():
    same_author_year_title = {
        **RECORD_A,
        "doi": "10.9999/other",
        "title": "Agentic Approaches Again",
    }
    result = bibtex.to_bibtex([RECORD_A, same_author_year_title])
    keys = [r["bibtex_key"] for r in result["records"]]
    assert len(keys) == len(set(keys))


def test_to_bibtex_entry_contains_required_fields():
    result = bibtex.to_bibtex([RECORD_A])
    entry = result["records"][0]["bibtex_entry"]
    assert entry.startswith("@article{")
    assert "author = {Chen, L. and Doe, A.}" in entry
    assert "title = {Agentic AI for Clinical Decision Support}" in entry
    assert "journal = {Journal of AI Research}" in entry
    assert "year = {2023}" in entry


def test_to_bibtex_omits_missing_fields_rather_than_fabricating():
    sparse = {
        "source": "openalex",
        "source_id": "https://openalex.org/W2",
        "title": "A Paper With No Authors Listed",
        "authors": [],
        "year": None,
        "venue": "",
        "abstract": "",
        "doi": "",
        "times_cited": 0,
        "is_oa": False,
        "url": "",
    }
    result = bibtex.to_bibtex([sparse])
    entry = result["records"][0]["bibtex_entry"]
    assert "author = " not in entry
    assert "year = " not in entry


def test_to_bibtex_preserves_times_cited_via_note_field():
    result = bibtex.to_bibtex([RECORD_A])
    entry = result["records"][0]["bibtex_entry"]
    assert "note = {Times Cited: 12}" in entry


def test_to_bibtex_omits_note_when_uncited():
    uncited = {**RECORD_A, "doi": "10.1/uncited", "times_cited": 0}
    result = bibtex.to_bibtex([uncited])
    entry = result["records"][0]["bibtex_entry"]
    assert "note = " not in entry


def test_to_bibtex_arxiv_venue_falls_back_to_preprint_id():
    arxiv_record = {
        "source": "arxiv",
        "source_id": "http://arxiv.org/abs/2301.00001",
        "title": "A Preprint",
        "authors": ["Lee, K."],
        "year": 2023,
        "venue": "",
        "abstract": "",
        "doi": "",
        "times_cited": 0,
        "is_oa": True,
        "url": "http://arxiv.org/abs/2301.00001",
    }
    result = bibtex.to_bibtex([arxiv_record])
    entry = result["records"][0]["bibtex_entry"]
    assert "journal = {arXiv preprint http://arxiv.org/abs/2301.00001}" in entry


def test_to_bibtex_strips_braces_that_would_break_downstream_parsing():
    braced = {**RECORD_A, "doi": "", "title": "A {Nested} Title with {braces}"}
    result = bibtex.to_bibtex([braced])
    entry = result["records"][0]["bibtex_entry"]
    assert "(Nested) Title with (braces)" in entry
    assert "{Nested}" not in entry
    assert "{braces}" not in entry


def test_normalize_openalex_work_reconstructs_abstract_and_strips_doi_prefix():
    work = {
        "id": "https://openalex.org/W123",
        "display_name": "A Sample Work",
        "authorships": [
            {"author": {"display_name": "Alice Smith"}},
            {"author": {"display_name": "Bob Jones"}},
        ],
        "publication_year": 2022,
        "primary_location": {"source": {"display_name": "Some Journal"}},
        "abstract_inverted_index": {"We": [0], "study": [1], "agents": [2]},
        "cited_by_count": 7,
        "doi": "https://doi.org/10.1111/foo",
        "open_access": {"is_oa": True},
    }
    normalized = sources.normalize_openalex_work(work)
    assert normalized["title"] == "A Sample Work"
    assert normalized["authors"] == ["Alice Smith", "Bob Jones"]
    assert normalized["abstract"] == "We study agents"
    assert normalized["doi"] == "10.1111/foo"
    assert normalized["times_cited"] == 7
    assert normalized["is_oa"] is True


def test_normalize_openalex_work_handles_missing_optional_fields():
    normalized = sources.normalize_openalex_work({"id": "https://openalex.org/W999"})
    assert normalized["title"] == ""
    assert normalized["authors"] == []
    assert normalized["abstract"] == ""
    assert normalized["doi"] == ""
    assert normalized["times_cited"] == 0
    assert normalized["is_oa"] is False


ARXIV_ENTRY_XML = """
<entry xmlns="http://www.w3.org/2005/Atom">
  <id>http://arxiv.org/abs/2301.00001v1</id>
  <title>  A Multi-Line
  Title About Agents  </title>
  <summary>  An abstract
  spanning lines.  </summary>
  <published>2023-01-15T00:00:00Z</published>
  <author><name>Jane Roe</name></author>
  <author><name>John Doe</name></author>
</entry>
"""


def test_normalize_arxiv_entry_extracts_and_flattens_whitespace():
    entry = ET.fromstring(ARXIV_ENTRY_XML)
    normalized = sources.normalize_arxiv_entry(entry)
    assert normalized["title"] == "A Multi-Line Title About Agents"
    assert normalized["abstract"] == "An abstract spanning lines."
    assert normalized["year"] == 2023
    assert normalized["authors"] == ["Jane Roe", "John Doe"]
    assert normalized["source"] == "arxiv"
    assert normalized["times_cited"] == 0
    assert normalized["is_oa"] is True
