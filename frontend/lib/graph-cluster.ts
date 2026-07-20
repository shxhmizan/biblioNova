/**
 * Connected-component clustering for networks that don't carry a semantic
 * cluster assignment from the backend (e.g. co-citation, whose MCP tool only
 * returns nodes + edges). This mirrors what VOSviewer itself does — its
 * clusters are derived from network structure, not a separate topic model.
 */

interface ClusterableNode {
  id: string;
}

interface ClusterableLink {
  source: string;
  target: string;
}

export function assignClustersByComponent(
  nodes: ClusterableNode[],
  links: ClusterableLink[]
): Map<string, number> {
  const parent = new Map<string, string>();
  nodes.forEach((n) => parent.set(n.id, n.id));

  function find(x: string): string {
    let root = x;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    while (parent.get(x) !== root) {
      const next = parent.get(x)!;
      parent.set(x, root);
      x = next;
    }
    return root;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  links.forEach((l) => {
    if (parent.has(l.source) && parent.has(l.target)) union(l.source, l.target);
  });

  const componentMembers = new Map<string, string[]>();
  nodes.forEach((n) => {
    const root = find(n.id);
    const members = componentMembers.get(root) ?? [];
    members.push(n.id);
    componentMembers.set(root, members);
  });

  // Largest component becomes cluster 0 — keeps coloring stable/meaningful
  // (the dominant cluster always gets the first palette color) rather than
  // depending on iteration order.
  const rootsBySize = [...componentMembers.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([root]) => root);
  const clusterIndexByRoot = new Map(rootsBySize.map((root, i) => [root, i]));

  const result = new Map<string, number>();
  nodes.forEach((n) => result.set(n.id, clusterIndexByRoot.get(find(n.id))!));
  return result;
}
