"""Tolerant BibTeX parsing: one malformed entry must never abort the whole file.

bibtexparser's whole-file parser aborts on the first syntax error, which is
unusable for real Web of Science exports (missing braces, stray fields, etc.).
Instead we split the file into individual top-level entry blocks ourselves
(brace-balanced), then parse each block independently so a single bad entry
just gets logged and skipped.
"""

import re
from collections import Counter

import bibtexparser
from bibtexparser.bparser import BibTexParser

_RECORD_TYPES = {"article", "inproceedings", "proceedings", "incollection", "book", "misc"}

_REQUIRED_FIELDS: dict[str, set[str]] = {
    "article": {"author", "title", "journal", "year"},
    "inproceedings": {"author", "title", "booktitle", "year"},
    "proceedings": {"title", "year"},
    "incollection": {"author", "title", "booktitle", "year"},
    "book": {"author", "title", "year"},
    "misc": {"title", "year"},
}

_TIMES_CITED_RE = re.compile(r"times cited:\s*(\d+)", re.IGNORECASE)


def split_entries(raw: str) -> list[str]:
    """Split raw BibTeX text into brace-balanced `@type{...}` blocks."""
    entries: list[str] = []
    i, n = 0, len(raw)
    while i < n:
        at = raw.find("@", i)
        if at == -1:
            break
        brace = raw.find("{", at)
        if brace == -1:
            break
        depth = 1
        j = brace + 1
        while j < n and depth > 0:
            if raw[j] == "{":
                depth += 1
            elif raw[j] == "}":
                depth -= 1
            j += 1
        entries.append(raw[at:j])
        i = j
    return entries


def _entry_type(block: str) -> str:
    match = re.match(r"@(\w+)", block)
    return match.group(1).lower() if match else ""


def _parse_times_cited(entry: dict) -> int:
    note = entry.get("note", "")
    match = _TIMES_CITED_RE.search(note)
    return int(match.group(1)) if match else 0


def _parse_year(entry: dict) -> int | None:
    raw_year = entry.get("year", "").strip()
    return int(raw_year) if raw_year.isdigit() else None


def parse_bibtex(content: str) -> dict:
    """Parse raw BibTeX content into validated records, skipping malformed entries.

    Returns:
        {
          "records": [{id, entry_type, author, title, journal, year, volume,
                       number, pages, doi, keywords, times_cited}, ...],
          "skipped": [{key, reason}, ...],
          "total_entries_found": int,
          "valid_count": int,
          "skipped_count": int,
        }
    """
    blocks = split_entries(content)
    records: list[dict] = []
    skipped: list[dict] = []
    seen_keys: set[str] = set()
    considered = 0

    for block in blocks:
        entry_type = _entry_type(block)
        if entry_type not in _RECORD_TYPES:
            continue  # @comment / @string / @preamble etc. are not literature records
        considered += 1

        parser = BibTexParser(common_strings=True)
        parser.ignore_nonstandard_types = False
        try:
            db = bibtexparser.loads(block, parser=parser)
        except Exception as exc:  # noqa: BLE001 - genuinely any parse failure must be tolerated
            skipped.append({"key": None, "reason": f"unparseable entry: {exc}"})
            continue

        if not db.entries:
            skipped.append({"key": None, "reason": "unparseable entry: no fields recognized"})
            continue

        entry = db.entries[0]
        key = entry.get("ID", "")

        if key in seen_keys:
            skipped.append({"key": key, "reason": f"duplicate citation key: {key}"})
            continue

        required = _REQUIRED_FIELDS.get(entry_type, {"title", "year"})
        missing = sorted(f for f in required if not entry.get(f, "").strip())
        if missing:
            skipped.append(
                {"key": key or None, "reason": f"missing required field(s): {', '.join(missing)}"}
            )
            continue

        year = _parse_year(entry)
        if year is None:
            skipped.append({"key": key, "reason": "invalid or non-numeric year"})
            continue

        seen_keys.add(key)
        records.append(
            {
                "id": key,
                "entry_type": entry_type,
                "author": entry.get("author", ""),
                "title": entry.get("title", ""),
                "journal": entry.get("journal") or entry.get("booktitle") or "",
                "year": year,
                "volume": entry.get("volume", ""),
                "number": entry.get("number", ""),
                "pages": entry.get("pages", ""),
                "doi": entry.get("doi", ""),
                "keywords": entry.get("keywords", ""),
                "times_cited": _parse_times_cited(entry),
            }
        )

    return {
        "records": records,
        "skipped": skipped,
        "total_entries_found": considered,
        "valid_count": len(records),
        "skipped_count": len(skipped),
    }


def extract_metadata(records: list[dict], skipped: list[dict] | None = None) -> dict:
    """Compute corpus-level stats from already-parsed records."""
    skipped = skipped or []
    years = [r["year"] for r in records if r.get("year")]
    authors: Counter[str] = Counter()
    journals: Counter[str] = Counter()
    for r in records:
        for name in r.get("author", "").split(" and "):
            name = name.strip()
            if name:
                authors[name] += 1
        journal = r.get("journal", "").strip()
        if journal:
            journals[journal] += 1

    return {
        "record_count": len(records),
        "valid_count": len(records),
        "skipped_count": len(skipped),
        "year_min": min(years) if years else None,
        "year_max": max(years) if years else None,
        "unique_authors": len(authors),
        "unique_journals": len(journals),
        "skipped": skipped,
    }
