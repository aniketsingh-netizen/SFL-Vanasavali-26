export type Edge = { sourceId: string; targetId: string; type: "PARENT_CHILD" | "SPOUSE" | "SIBLING" };

export function createsParentCycle(edges: Edge[], sourceId: string, targetId: string): boolean {
  if (sourceId === targetId) return true;
  const childrenByParent = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.type !== "PARENT_CHILD") continue;
    const children = childrenByParent.get(edge.sourceId) ?? [];
    children.push(edge.targetId);
    childrenByParent.set(edge.sourceId, children);
  }

  const pending = [targetId];
  const visited = new Set<string>();
  while (pending.length) {
    const current = pending.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    pending.push(...(childrenByParent.get(current) ?? []));
  }
  return false;
}

export function canonicalPair(sourceId: string, targetId: string, type: Edge["type"]) {
  if (type === "PARENT_CHILD" || sourceId < targetId) return { sourceId, targetId };
  return { sourceId: targetId, targetId: sourceId };
}
