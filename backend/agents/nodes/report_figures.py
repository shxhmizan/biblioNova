"""Matplotlib figure generation for the PDF report.

The only place in this codebase that produces static chart images — the
frontend renders its own interactive charts from the same underlying JSON
(react-force-graph-2d, Recharts). This module exists specifically for the
report, per the locked architecture: "Matplotlib for report figures".
"""

import io

import matplotlib

matplotlib.use("Agg")  # non-interactive backend — this runs server-side, no display

import networkx as nx
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.lines import Line2D

# Same categorical palette used on the frontend (lib/chart-colors.ts, light
# mode) so a figure looks like it belongs to the same product as the app.
_CATEGORICAL_PALETTE = [
    "#2a78d6",
    "#1baf7a",
    "#eda100",
    "#008300",
    "#4a3aa7",
    "#e34948",
    "#e87ba4",
    "#eb6834",
]
_GRIDLINE = "#e1e0d9"
_TOP_N_NODES = 25


def _cluster_color(cluster: int) -> str:
    return _CATEGORICAL_PALETTE[cluster % len(_CATEGORICAL_PALETTE)]


def _fig_to_png_bytes(fig) -> bytes:
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.getvalue()


def _strip_spines(ax) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)


def publication_trend_figure(years: list[int], publications_per_year: list[int]) -> bytes:
    fig, ax = plt.subplots(figsize=(6, 3), dpi=150)
    color = _CATEGORICAL_PALETTE[0]
    ax.plot(years, publications_per_year, color=color, linewidth=2, marker="o", markersize=3)
    ax.fill_between(years, publications_per_year, color=color, alpha=0.15)
    ax.set_xlabel("Year", fontsize=9)
    ax.set_ylabel("Publications", fontsize=9)
    ax.set_title("Publications per Year", fontsize=10, fontweight="bold")
    ax.grid(axis="y", linestyle="--", alpha=0.4, color=_GRIDLINE)
    ax.tick_params(labelsize=8)
    _strip_spines(ax)
    fig.tight_layout()
    return _fig_to_png_bytes(fig)


def citations_bar_figure(years: list[int], citations_per_year: list[int]) -> bytes:
    fig, ax = plt.subplots(figsize=(6, 3), dpi=150)
    ax.bar(years, citations_per_year, color=_CATEGORICAL_PALETTE[1])
    ax.set_xlabel("Year", fontsize=9)
    ax.set_ylabel("Citations", fontsize=9)
    ax.set_title("Citations per Year", fontsize=10, fontweight="bold")
    ax.grid(axis="y", linestyle="--", alpha=0.4, color=_GRIDLINE)
    ax.tick_params(labelsize=8)
    _strip_spines(ax)
    fig.tight_layout()
    return _fig_to_png_bytes(fig)


def co_occurrence_network_figure(nodes: list[dict], edges: list[dict]) -> bytes | None:
    """Keyword co-occurrence network diagram, colored by cluster.

    Capped to the top N nodes by frequency — a full corpus-scale graph (dozens
    of nodes, hundreds of edges) is illegible as a static print figure, even
    though the frontend's interactive version can show all of it.
    """
    if not nodes:
        return None

    top_nodes = sorted(nodes, key=lambda n: n["frequency"], reverse=True)[:_TOP_N_NODES]
    top_ids = {n["id"] for n in top_nodes}
    kept_edges = [e for e in edges if e["source"] in top_ids and e["target"] in top_ids]

    graph = nx.Graph()
    for n in top_nodes:
        graph.add_node(n["id"], frequency=n["frequency"], cluster=n["cluster"])
    for e in kept_edges:
        graph.add_edge(e["source"], e["target"], weight=e["weight"])

    # k/iterations tuned for legibility at report size: real corpora tend to
    # have one or two dominant hub keywords (near-universal terms) that
    # spring_layout otherwise pulls right on top of each other.
    pos = nx.spring_layout(graph, seed=42, k=1.6, iterations=300)
    max_freq = max(n["frequency"] for n in top_nodes)
    # Capped size range (not just scaled by frequency) so dominant hub nodes
    # don't grow large enough to visually collide with their neighbors.
    node_sizes = [60 + (graph.nodes[n]["frequency"] / max_freq) * 260 for n in graph.nodes]
    node_colors = [_cluster_color(graph.nodes[n]["cluster"]) for n in graph.nodes]
    max_weight = max((e["weight"] for e in kept_edges), default=1)
    edge_widths = [0.4 + (graph[u][v]["weight"] / max_weight) * 2 for u, v in graph.edges]

    fig, ax = plt.subplots(figsize=(7.5, 6), dpi=150)
    nx.draw_networkx_edges(graph, pos, ax=ax, width=edge_widths, edge_color=_GRIDLINE, alpha=0.7)
    nx.draw_networkx_nodes(
        graph,
        pos,
        ax=ax,
        node_size=node_sizes,
        node_color=node_colors,
        edgecolors="white",
        linewidths=0.5,
    )
    # Push each label radially outward from the layout centroid (scaled by its
    # own node radius) instead of drawing it centered on the node — two large,
    # strongly co-occurring hub nodes sitting next to each other would
    # otherwise get illegibly overlapping labels.
    positions = np.array(list(pos.values()))
    centroid = positions.mean(axis=0)
    label_pos = {}
    for i, node_id in enumerate(graph.nodes):
        x, y = pos[node_id]
        dx, dy = x - centroid[0], y - centroid[1]
        dist = max((dx**2 + dy**2) ** 0.5, 1e-6)
        radius_frac = (node_sizes[i] ** 0.5) / 900
        offset = 0.09 + radius_frac
        label_pos[node_id] = (x + dx / dist * offset, y + dy / dist * offset)
    nx.draw_networkx_labels(graph, label_pos, ax=ax, font_size=6.5)
    ax.set_title("Keyword Co-occurrence Network", fontsize=10, fontweight="bold")
    ax.axis("off")

    clusters = sorted({graph.nodes[n]["cluster"] for n in graph.nodes})
    legend_handles = [
        Line2D(
            [0],
            [0],
            marker="o",
            color="none",
            markerfacecolor=_cluster_color(c),
            markersize=7,
            label=f"Cluster {c}",
        )
        for c in clusters
    ]
    ax.legend(
        handles=legend_handles,
        loc="upper left",
        fontsize=6,
        frameon=False,
        bbox_to_anchor=(1.0, 1.0),
    )
    fig.tight_layout()
    return _fig_to_png_bytes(fig)
