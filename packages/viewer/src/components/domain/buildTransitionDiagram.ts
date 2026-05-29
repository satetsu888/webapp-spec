import type { Transition } from "@webapp-spec/types";

function formatNode(state: string): string {
  return state === "_start" || state === "_end" ? "[*]" : state;
}

export function buildTransitionDiagram(transition: Transition): string | null {
  if (transition.changes.length === 0) return null;

  const lines = ["stateDiagram-v2"];

  for (const ch of transition.changes) {
    const alias = ch.entity.replace(/[^a-zA-Z0-9]/g, "_");
    lines.push(`    state ${alias} {`);
    lines.push(`        ${formatNode(ch.state.from)} --> ${formatNode(ch.state.to)}`);
    lines.push(`    }`);
  }

  return lines.join("\n");
}
