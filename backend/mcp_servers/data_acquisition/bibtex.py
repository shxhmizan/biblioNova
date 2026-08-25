"""Cross-source dedupe and BibTeX generation for retrieved paper records.

Downstream bibtex-parser-server already skips (never crashes on) entries
missing required fields, so a record with e.g. no journal/venue just omits
that field here and lets the parser's existing tolerance handle it — the
same path a messy uploaded .bib file already goes through.
"""

import re
from collections import Counter

_BRACE_MAP = str.maketrans({"{": "(", "}": ")"})


def _normalize_title(title: str) -> str:
    lowered = title.lower()
    stripped = re.sub(r"[^a-z0-9\s]", "", lowered)
    return " ".join(stripped.split())


def _sanitize(value: str) -> str:
    # bibtex-parser-server's split_entries does raw brace-balance counting,
    # so an unescaped literal '{' or '}' in a field value would corrupt
    # entry splitting downstream — strip rather than escape, simplest safe fix.
    return value.translate(_BRACE_MAP).replace("\n", " ").strip()


def _dedupe(records: list[dict]) -> tuple[list[dict], int]:
    kept: list[dict] = []
    seen_dois: set[str] = set()
    seen_titles: set[str] = set()
    duplicates = 0

    for record in records:
        doi = (record.get("doi") or "").strip().lower()
        title_key = _normalize_title(record.get("title", ""))

        if (doi and doi in seen_dois) or (title_key and title_key in seen_titles):
            duplicates += 1
            continue

        if doi:
            seen_dois.add(doi)
        if title_key:
            seen_titles.add(title_key)
        kept.append(record)

    return kept, duplicates


def _make_key(record: dict, used_keys: Counter) -> str:
    authors = record.get("authors") or []
    last_name = "unknown"
    if authors:
        first_author = authors[0]
        raw_last = first_author.split(",")[0].strip().split(" ")[0]
        last_name = re.sub(r"[^a-z0-9]", "", raw_last.lower()) or "unknown"

    year = record.get("year") or "nd"
    title_word = next(
        (w for w in _normalize_title(record.get("title", "")).split() if len(w) > 3),
        "paper",
    )

    base = f"{last_name}{year}{title_word}"
    used_keys[base] += 1
    return base if used_keys[base] == 1 else f"{base}{used_keys[base]}"


def _build_entry(record: dict, key: str) -> str:
    authors = " and ".join(_sanitize(a) for a in (record.get("authors") or []) if a)
    title = _sanitize(record.get("title", ""))
    year = record.get("year") or ""
    venue = _sanitize(record.get("venue", "")) or (
        f"arXiv preprint {record.get('source_id', '')}" if record.get("source") == "arxiv" else ""
    )
    doi = _sanitize(record.get("doi", ""))
    abstract = _sanitize(record.get("abstract", ""))
    times_cited = record.get("times_cited") or 0
    # bibtex-parser-server reads citation counts from a WoS-style "Times
    # Cited: N" substring inside the note field (see _parse_times_cited) --
    # writing that same convention here is how OpenAlex's real citation
    # counts survive the round trip into the parsed corpus.
    note = f"Times Cited: {times_cited}" if times_cited else ""

    fields = [
        f"  author = {{{authors}}}," if authors else None,
        f"  title = {{{title}}}," if title else None,
        f"  journal = {{{venue}}}," if venue else None,
        f"  year = {{{year}}}," if year else None,
        f"  doi = {{{doi}}}," if doi else None,
        f"  note = {{{note}}}," if note else None,
        f"  abstract = {{{abstract}}}," if abstract else None,
    ]
    body = "\n".join(f for f in fields if f)
    return f"@article{{{key},\n{body}\n}}"


def to_bibtex(records: list[dict]) -> dict:
    """Dedupe cross-source records (by DOI, then normalized title) and convert
    each surviving record into a standalone BibTeX entry.
    """
    deduped, duplicates_removed = _dedupe(records)

    used_keys: Counter[str] = Counter()
    out = []
    for record in deduped:
        key = _make_key(record, used_keys)
        out.append({**record, "bibtex_key": key, "bibtex_entry": _build_entry(record, key)})

    return {"records": out, "duplicates_removed": duplicates_removed}
