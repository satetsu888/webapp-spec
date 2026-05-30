import type { View, Component } from "@webapp-spec/types";

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;");
}

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_");
}

export function buildViewCompositionDiagram(
  view: View,
  componentMap: Map<string, Component>,
): string | null {
  const edges: { componentId: string; operationId: string; params: string[] }[] =
    [];

  for (const action of view.actions) {
    const grouped = new Map<string, string[]>();
    for (const [param, source] of Object.entries(action.inputFrom)) {
      const dotIndex = source.indexOf(".");
      if (dotIndex === -1) continue;
      const componentId = source.slice(0, dotIndex);
      const list = grouped.get(componentId) ?? [];
      list.push(param);
      grouped.set(componentId, list);
    }
    for (const [componentId, params] of grouped) {
      edges.push({ componentId, operationId: action.operation, params });
    }
  }

  if (edges.length === 0) return null;

  const componentIds = new Set(edges.map((e) => e.componentId));
  const operationIds = new Set(edges.map((e) => e.operationId));

  const lines = ["flowchart LR"];

  for (const cid of componentIds) {
    const comp = componentMap.get(cid);
    const label = comp ? comp.description : cid;
    lines.push(`    c_${sanitizeId(cid)}["${escapeLabel(cid)}\\n${escapeLabel(label)}"]`);
  }

  for (const uid of operationIds) {
    lines.push(`    u_${sanitizeId(uid)}(["${escapeLabel(uid)}"])`);
  }

  for (const { componentId, operationId, params } of edges) {
    const cNode = `c_${sanitizeId(componentId)}`;
    const uNode = `u_${sanitizeId(operationId)}`;
    const label = params.join(", ");
    lines.push(`    ${cNode} -- "${escapeLabel(label)}" --> ${uNode}`);
  }

  for (const uid of operationIds) {
    lines.push(
      `    click u_${sanitizeId(uid)} href "/operations/${uid}"`,
    );
  }

  return lines.join("\n");
}
