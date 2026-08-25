"""Core analysis functions for the science-mapping-server."""

from collections import Counter
from itertools import combinations

import networkx as nx


def _split_keywords(raw: str) -> list[str]:
    separator = ";" if ";" in raw else ","
    return [kw.strip().lower() for kw in raw.split(separator) if kw.strip()]


def co_occurrence_analysis(records: list[dict], min_frequency: int = 2) -> dict:
    """Keyword co-occurrence network: nodes sized by frequency, clustered by community."""
    keyword_lists = [_split_keywords(r.get("keywords", "")) for r in records]

    frequency: Counter[str] = Counter()
    for keywords in keyword_lists:
        frequency.update(set(keywords))

    kept = {kw for kw, count in frequency.items() if count >= min_frequency}
    if not kept:
        return {"nodes": [], "edges": [], "clusters": 0}

    graph = nx.Graph()
    graph.add_nodes_from(kept)

    for keywords in keyword_lists:
        present = sorted(set(keywords) & kept)
        for a, b in combinations(present, 2):
            if graph.has_edge(a, b):
                graph[a][b]["weight"] += 1
            else:
                graph.add_edge(a, b, weight=1)

    communities = list(nx.algorithms.community.greedy_modularity_communities(graph))
    cluster_of = {kw: idx for idx, community in enumerate(communities) for kw in community}

    nodes = [
        {
            "id": kw,
            "label": kw,
            "frequency": frequency[kw],
            "cluster": cluster_of.get(kw, 0),
        }
        for kw in kept
    ]
    edges = [
        {"source": a, "target": b, "weight": data["weight"]}
        for a, b, data in graph.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges, "clusters": len(communities)}


def cocitation_analysis(records: list[dict]) -> dict:
    """Paper co-citation network, built from each record's cited_references field.

    Only citation keys pointing to other records in this same corpus are
    usable; standard WoS BibTeX exports carry no reference lists at all, in
    which case this returns an empty network with an explanatory note rather
    than fabricating a result.
    """
    known = {r["id"]: r for r in records}
    citing_lists = [
        [cited for cited in r.get("cited_references", []) if cited in known and cited != r["id"]]
        for r in records
    ]

    if not any(citing_lists):
        return {
            "nodes": [],
            "edges": [],
            "note": (
                "No cited-reference data found in this corpus export. Standard Web of "
                "Science BibTeX exports do not include reference lists; co-citation "
                "analysis requires a 'cited-references' field populated by a converter "
                "that preserves it."
            ),
        }

    pair_counts: Counter[tuple[str, str]] = Counter()
    co_cited_ids: set[str] = set()
    for cited in citing_lists:
        for a, b in combinations(sorted(set(cited)), 2):
            pair_counts[(a, b)] += 1
            co_cited_ids.update((a, b))

    nodes = [
        {"id": rid, "title": known[rid]["title"], "times_cited": known[rid].get("times_cited", 0)}
        for rid in co_cited_ids
    ]
    edges = [{"source": a, "target": b, "weight": count} for (a, b), count in pair_counts.items()]

    return {"nodes": nodes, "edges": edges}


def bibliographic_coupling_analysis(records: list[dict], min_shared_refs: int = 2) -> dict:
    """Paper bibliographic-coupling network: two papers are linked if they share
    entries in their own cited_references lists, weighted by the number shared.

    Depends on the same optional 'cited-references' field as cocitation_analysis
    (absent from standard WoS BibTeX exports), so it fails the same way when
    that data isn't present rather than fabricating a result.
    """
    ref_sets = [set(r.get("cited_references", [])) for r in records]

    if not any(ref_sets):
        return {
            "nodes": [],
            "edges": [],
            "note": (
                "No cited-reference data found in this corpus export. Standard Web of "
                "Science BibTeX exports do not include reference lists; bibliographic "
                "coupling requires a 'cited-references' field populated by a converter "
                "that preserves it."
            ),
        }

    edges = []
    coupled_ids: set[str] = set()
    for (i, a), (j, b) in combinations(enumerate(records), 2):
        shared = len(ref_sets[i] & ref_sets[j])
        if shared >= min_shared_refs:
            edges.append({"source": a["id"], "target": b["id"], "weight": shared})
            coupled_ids.update((a["id"], b["id"]))

    nodes = [
        {"id": r["id"], "title": r["title"], "times_cited": r.get("times_cited", 0)}
        for r in records
        if r["id"] in coupled_ids
    ]

    return {"nodes": nodes, "edges": edges}
