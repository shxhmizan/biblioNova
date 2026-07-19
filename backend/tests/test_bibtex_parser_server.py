from mcp_servers.bibtex_parser import parsing

VALID_ENTRY = """
@article{smith2020ai, author={Smith, J. and Doe, A.}, title={A Study of AI},
journal={J. AI Research}, year={2020}, note={Times Cited: 12}}
"""

MISSING_YEAR = """
@article{nobody2021, author={Nobody, N.}, title={Missing Year}, journal={J. X}}
"""

DUPLICATE_KEY = """
@article{dup2019, author={A, B.}, title={First}, journal={J. A}, year={2019}}
@article{dup2019, author={C, D.}, title={Second}, journal={J. B}, year={2019}}
"""

UNPARSEABLE = """
@article{broken2022, author={A, B.} title={Missing comma} journal={J} year={2022}}
"""

NON_NUMERIC_YEAR = """
@article{badyear2020, author={A, B.}, title={T}, journal={J}, year={n.d.}}
"""

COMMENT_BLOCK = """
@comment{This is a WoS export header, not a literature record}
"""


def test_parses_valid_entry_with_times_cited():
    result = parsing.parse_bibtex(VALID_ENTRY)
    assert result["valid_count"] == 1
    assert result["skipped_count"] == 0
    record = result["records"][0]
    assert record["id"] == "smith2020ai"
    assert record["year"] == 2020
    assert record["times_cited"] == 12


def test_skips_entry_missing_required_field():
    result = parsing.parse_bibtex(MISSING_YEAR)
    assert result["valid_count"] == 0
    assert result["skipped_count"] == 1
    assert "year" in result["skipped"][0]["reason"]


def test_skips_duplicate_citation_key():
    result = parsing.parse_bibtex(DUPLICATE_KEY)
    assert result["valid_count"] == 1
    assert result["skipped_count"] == 1
    assert "duplicate citation key" in result["skipped"][0]["reason"]


def test_skips_unparseable_entry_without_aborting_file():
    combined = UNPARSEABLE + VALID_ENTRY
    result = parsing.parse_bibtex(combined)
    assert result["valid_count"] == 1
    assert result["skipped_count"] == 1
    assert result["records"][0]["id"] == "smith2020ai"


def test_skips_non_numeric_year():
    result = parsing.parse_bibtex(NON_NUMERIC_YEAR)
    assert result["valid_count"] == 0
    assert "year" in result["skipped"][0]["reason"]


def test_ignores_non_record_entry_types():
    result = parsing.parse_bibtex(COMMENT_BLOCK)
    assert result["total_entries_found"] == 0
    assert result["valid_count"] == 0
    assert result["skipped_count"] == 0


def test_extract_metadata_computes_year_range_and_uniques():
    parsed = parsing.parse_bibtex(VALID_ENTRY + DUPLICATE_KEY)
    metadata = parsing.extract_metadata(parsed["records"], parsed["skipped"])
    assert metadata["record_count"] == 2
    assert metadata["year_min"] == 2019
    assert metadata["year_max"] == 2020
    assert metadata["unique_authors"] == 3
    assert metadata["skipped_count"] == 1
