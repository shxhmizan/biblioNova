"""HTTP calls to OpenAlex and arXiv, normalized into a uniform record schema.

Both APIs are free and keyless. Network failures, timeouts, or malformed
responses degrade to zero results from that source rather than raising —
one flaky upstream must never crash the search.
"""

import xml.etree.ElementTree as ET
from datetime import datetime

import httpx

OPENALEX_BASE_URL = "https://api.openalex.org/works"
ARXIV_BASE_URL = "http://export.arxiv.org/api/query"
REQUEST_TIMEOUT_SECONDS = 15.0

ARXIV_NS = {"atom": "http://www.w3.org/2005/Atom"}


def _reconstruct_abstract(inverted_index: dict[str, list[int]] | None) -> str:
    """OpenAlex returns abstracts as a word -> [positions] inverted index, not text."""
    if not inverted_index:
        return ""
    positions: dict[int, str] = {}
    for word, idxs in inverted_index.items():
        for i in idxs:
            positions[i] = word
    return " ".join(positions[i] for i in sorted(positions))


def normalize_openalex_work(work: dict) -> dict:
    authorships = work.get("authorships") or []
    authors = [a.get("author", {}).get("display_name", "") for a in authorships]
    authors = [a for a in authors if a]

    primary_location = work.get("primary_location") or {}
    source = primary_location.get("source") or {}
    venue = source.get("display_name") or ""

    doi = work.get("doi") or ""
    if doi.startswith("https://doi.org/"):
        doi = doi[len("https://doi.org/") :]

    return {
        "source": "openalex",
        "source_id": work.get("id", ""),
        "title": work.get("display_name") or "",
        "authors": authors,
        "year": work.get("publication_year"),
        "venue": venue,
        "abstract": _reconstruct_abstract(work.get("abstract_inverted_index")),
        "doi": doi,
        "times_cited": work.get("cited_by_count", 0) or 0,
        "is_oa": bool((work.get("open_access") or {}).get("is_oa", False)),
        "url": work.get("id", ""),
    }


async def search_openalex(
    query: str,
    max_results: int = 50,
    year_from: int | None = None,
    year_to: int | None = None,
) -> list[dict]:
    filters = []
    if year_from is not None:
        filters.append(f"publication_year:>{year_from - 1}")
    if year_to is not None:
        filters.append(f"publication_year:<{year_to + 1}")

    params: dict[str, str | int] = {
        "search": query,
        "per-page": min(max(max_results, 1), 200),
        "sort": "relevance_score:desc",
        "select": (
            "id,display_name,authorships,publication_year,primary_location,"
            "abstract_inverted_index,cited_by_count,doi,open_access"
        ),
    }
    if filters:
        params["filter"] = ",".join(filters)

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(OPENALEX_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    results = data.get("results") or []
    return [normalize_openalex_work(w) for w in results[:max_results]]


def _text(el: ET.Element, tag: str) -> str:
    node = el.find(f"atom:{tag}", ARXIV_NS)
    return (node.text or "").strip() if node is not None and node.text else ""


def normalize_arxiv_entry(entry: ET.Element) -> dict:
    title = " ".join(_text(entry, "title").split())
    summary = " ".join(_text(entry, "summary").split())
    published = _text(entry, "published")

    year: int | None = None
    if published:
        try:
            year = datetime.fromisoformat(published.replace("Z", "+00:00")).year
        except ValueError:
            year = None

    authors = []
    for author_el in entry.findall("atom:author", ARXIV_NS):
        name_el = author_el.find("atom:name", ARXIV_NS)
        if name_el is not None and name_el.text:
            authors.append(name_el.text.strip())

    url = _text(entry, "id")

    return {
        "source": "arxiv",
        "source_id": url,
        "title": title,
        "authors": authors,
        "year": year,
        "venue": "arXiv",
        "abstract": summary,
        "doi": "",
        "times_cited": 0,
        "is_oa": True,
        "url": url,
    }


async def search_arxiv(query: str, max_results: int = 50) -> list[dict]:
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max(max_results, 1),
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(ARXIV_BASE_URL, params=params)
            response.raise_for_status()
            root = ET.fromstring(response.text)
    except (httpx.HTTPError, ET.ParseError):
        return []

    entries = root.findall("atom:entry", ARXIV_NS)
    return [normalize_arxiv_entry(e) for e in entries[:max_results]]
