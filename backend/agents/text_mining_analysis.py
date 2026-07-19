"""Pure semantic-clustering logic for the Text Mining specialist.

Kept separate from the sentence-transformers model loading so clustering and
labeling can be unit-tested with plain numpy arrays, no model download needed.
"""

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.mixture import GaussianMixture

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model = None  # lazy singleton — only loaded when embed_texts() is actually called


def embed_texts(texts: list[str]) -> np.ndarray:
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(_MODEL_NAME)
    return np.asarray(_model.encode(texts))


def choose_n_clusters(n_records: int) -> int:
    if n_records < 2:
        return 1
    return max(2, min(6, n_records // 8))


def _label_cluster(texts: list[str]) -> list[str]:
    if not texts:
        return []
    try:
        vectorizer = CountVectorizer(stop_words="english", max_features=3)
        vectorizer.fit(texts)
        return list(vectorizer.get_feature_names_out())
    except ValueError:
        return []  # e.g. all-stopword / empty vocabulary for a tiny cluster


def cluster_records(records: list[dict], embeddings: np.ndarray, n_clusters: int) -> dict:
    """Fit a Gaussian Mixture Model over embeddings and build labeled cluster summaries."""
    gmm = GaussianMixture(n_components=n_clusters, random_state=42)
    labels = gmm.fit_predict(embeddings)
    probabilities = gmm.predict_proba(embeddings)

    clusters = []
    for cluster_id in range(n_clusters):
        member_indices = [i for i, label in enumerate(labels) if label == cluster_id]
        if not member_indices:
            continue

        member_titles = [records[i]["title"] for i in member_indices]
        top_keywords = _label_cluster(member_titles)

        ranked = sorted(member_indices, key=lambda i: probabilities[i][cluster_id], reverse=True)
        representative_titles = [records[i]["title"] for i in ranked[:3]]

        clusters.append(
            {
                "cluster_id": cluster_id,
                "label": ", ".join(top_keywords) if top_keywords else f"Cluster {cluster_id}",
                "size": len(member_indices),
                "top_keywords": top_keywords,
                "representative_titles": representative_titles,
                "record_ids": [records[i]["id"] for i in member_indices],
            }
        )

    return {"n_clusters": len(clusters), "clusters": clusters}
