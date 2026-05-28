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
  const edges: { componentId: string; usecaseId: string; params: string[] }[] =
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
      edges.push({ componentId, usecaseId: action.usecase, params });
    }
  }

  if (edges.length === 0) return null;

  const componentIds = new Set(edges.map((e) => e.componentId));
  const usecaseIds = new Set(edges.map((e) => e.usecaseId));

  const lines = ["flowchart LR"];

  for (const cid of componentIds) {
    const comp = componentMap.get(cid);
    const label = comp ? comp.description : cid;
    lines.push(`    c_${sanitizeId(cid)}["${escapeLabel(cid)}\\n${escapeLabel(label)}"]`);
  }

  for (const uid of usecaseIds) {
    lines.push(`    u_${sanitizeId(uid)}(["${escapeLabel(uid)}"])`);
  }

  for (const { componentId, usecaseId, params } of edges) {
    const cNode = `c_${sanitizeId(componentId)}`;
    const uNode = `u_${sanitizeId(usecaseId)}`;
    const label = params.join(", ");
    lines.push(`    ${cNode} -- "${escapeLabel(label)}" --> ${uNode}`);
  }

  for (const uid of usecaseIds) {
    lines.push(
      `    click u_${sanitizeId(uid)} href "/usecases/${uid}"`,
    );
  }

  return lines.join("\n");
}
