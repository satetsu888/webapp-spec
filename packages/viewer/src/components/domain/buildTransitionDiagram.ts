import type { Transition } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function stateVariant(state: string): "start" | "end" | "normal" {
  if (state === "_start") return "start";
  if (state === "_end") return "end";
  return "normal";
}

function stateLabel(state: string): string {
  if (state === "_start") return "";
  if (state === "_end") return "";
  return state;
}

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_");
}

export function buildTransitionDiagram(transition: Transition): FlowData | null {
  if (transition.changes.length === 0) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const ch of transition.changes) {
    const groupId = `g_${sanitizeId(ch.entity)}`;
    nodes.push({
      id: groupId,
      type: "group",
      position: { x: 0, y: 0 },
      data: { label: ch.entity },
    });

    const fromId = `${groupId}_from`;
    const toId = `${groupId}_to`;

    nodes.push({
      id: fromId,
      type: "state",
      position: { x: 0, y: 0 },
      parentId: groupId,
      extent: "parent" as const,
      data: { label: stateLabel(ch.state.from), variant: stateVariant(ch.state.from) },
    });

    nodes.push({
      id: toId,
      type: "state",
      position: { x: 0, y: 0 },
      parentId: groupId,
      extent: "parent" as const,
      data: { label: stateLabel(ch.state.to), variant: stateVariant(ch.state.to) },
    });

    edges.push({
      id: `e_${fromId}_${toId}`,
      source: fromId,
      target: toId,
    });
  }

  return { nodes, edges, direction: "DOWN" };
}
