import type { Transition } from "@webapp-spec/types";

export function buildStateDiagram(
  entityId: string,
  transitions: Transition[],
): string | null {
  const edges: { from: string; to: string; label: string }[] = [];

  for (const t of transitions) {
    for (const ch of t.changes) {
      if (ch.entity !== entityId) continue;
      edges.push({
        from: ch.state.from === "_start" ? "[*]" : ch.state.from,
        to: ch.state.to === "_end" ? "[*]" : ch.state.to,
        label: t.id,
      });
    }
  }

  if (edges.length === 0) return null;

  const lines = ["stateDiagram-v2"];
  for (const edge of edges) {
    lines.push(`    ${edge.from} --> ${edge.to}: ${edge.label}`);
  }
  return lines.join("\n");
}
