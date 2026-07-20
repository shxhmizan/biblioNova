import numpy as np

from agents.text_mining_analysis import choose_n_clusters, cluster_records


def test_choose_n_clusters_scales_with_corpus_size():
    assert choose_n_clusters(1) == 1
    assert choose_n_clusters(10) == 2
    assert choose_n_clusters(100) == 6  # capped at 6


def test_cluster_records_assigns_every_record_and_labels_clusters():
    records = [
        {"id": "a", "title": "Agentic AI planning methods"},
        {"id": "b", "title": "Agentic AI planning approaches"},
        {"id": "c", "title": "Healthcare diagnostic imaging models"},
        {"id": "d", "title": "Healthcare diagnostic imaging techniques"},
    ]
    # Two well-separated blobs so GMM has an easy, deterministic job.
    rng = np.random.default_rng(0)
    embeddings = np.vstack(
        [
            rng.normal(loc=0.0, scale=0.05, size=(2, 4)),
            rng.normal(loc=10.0, scale=0.05, size=(2, 4)),
        ]
    )

    result = cluster_records(records, embeddings, n_clusters=2)

    assert result["n_clusters"] == 2
    assert sum(c["size"] for c in result["clusters"]) == 4
    all_record_ids = {rid for c in result["clusters"] for rid in c["record_ids"]}
    assert all_record_ids == {"a", "b", "c", "d"}
    for cluster in result["clusters"]:
        assert cluster["label"]
        assert len(cluster["representative_titles"]) <= 3


def test_cluster_records_degrades_gracefully_for_single_record_corpus():
    # sklearn's GaussianMixture requires >= 2 samples regardless of
    # n_components — a 1-record corpus must not crash the pipeline.
    records = [{"id": "a", "title": "Agentic AI planning methods"}]
    embeddings = np.random.default_rng(0).normal(size=(1, 384))

    result = cluster_records(records, embeddings, n_clusters=1)

    assert result["n_clusters"] == 1
    assert result["clusters"][0]["size"] == 1
    assert result["clusters"][0]["record_ids"] == ["a"]


def test_cluster_records_handles_empty_corpus():
    result = cluster_records([], np.empty((0, 384)), n_clusters=1)
    assert result == {"n_clusters": 0, "clusters": []}
