import type { Transition, State } from "@webapp-spec/types";

type Edge = { from: string; to: string; label: string };

function formatNode(state: string): string {
  return state === "_start" || state === "_end" ? "[*]" : state;
}

export function buildStateDiagram(
  entityId: string,
  transitions: Transition[],
  states: State[],
): string | null {
  const stateToField = new Map<string, string>();
  for (const s of states) {
    stateToField.set(s.name, s.field);
  }

  const edgesByField = new Map<string, Edge[]>();

  for (const t of transitions) {
    for (const ch of t.changes) {
      if (ch.entity !== entityId) continue;
      const field =
        stateToField.get(ch.state.to) ??
        stateToField.get(ch.state.from) ??
        "unknown";
      const edges = edgesByField.get(field) ?? [];
      edges.push({
        from: formatNode(ch.state.from),
        to: formatNode(ch.state.to),
        label: t.id,
      });
      edgesByField.set(field, edges);
    }
  }

  if (edgesByField.size === 0) return null;

  const lines = ["stateDiagram-v2"];

  if (edgesByField.size === 1) {
    for (const edges of edgesByField.values()) {
      for (const e of edges) {
        lines.push(`    ${e.from} --> ${e.to}: ${e.label}`);
      }
    }
  } else {
    for (const [field, edges] of edgesByField) {
      lines.push(`    state "${field}" as ${field} {`);
      for (const e of edges) {
        lines.push(`        ${e.from} --> ${e.to}: ${e.label}`);
      }
      lines.push(`    }`);
    }
  }

  return lines.join("\n");
}
