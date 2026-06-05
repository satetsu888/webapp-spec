import type { Transition, State } from "@webapp-spec/types";
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

type EdgeInfo = { from: string; to: string; label: string };

export function buildStateDiagram(
  entityId: string,
  transitions: Transition[],
  states: State[],
): FlowData | null {
  const stateToField = new Map<string, string>();
  for (const s of states) {
    stateToField.set(s.name, s.field);
  }

  const allEdges: EdgeInfo[] = [];
  for (const t of transitions) {
    for (const ch of t.changes) {
      if (ch.entity !== entityId) continue;
      allEdges.push({ from: ch.state.from, to: ch.state.to, label: t.id });
    }
  }

  if (allEdges.length === 0) return null;

  // Collect all states and classify by field
  const allStateNames = new Set<string>();
  for (const e of allEdges) {
    allStateNames.add(e.from);
    allStateNames.add(e.to);
  }

  const fieldStates = new Map<string, string[]>();
  for (const s of allStateNames) {
    const field = stateToField.get(s);
    if (!field) continue;
    const list = fieldStates.get(field) ?? [];
    list.push(s);
    fieldStates.set(field, list);
  }

  const useGroups = fieldStates.size > 1;

  // BFS from _start for natural ordering
  const adj = new Map<string, string[]>();
  for (const e of allEdges) {
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
  }

  const order: string[] = [];
  const visited = new Set<string>();
  if (allStateNames.has("_start")) {
    const queue = ["_start"];
    visited.add("_start");
    while (queue.length > 0) {
      const cur = queue.shift()!;
      order.push(cur);
      for (const next of adj.get(cur) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }
  for (const s of allStateNames) {
    if (!visited.has(s)) order.push(s);
  }

  const orderIndex = new Map(order.map((s, i) => [s, i]));

  function nodeId(state: string): string {
    if (state === "_start" || state === "_end") return state;
    const field = stateToField.get(state);
    return useGroups && field ? `${field}_${state}` : state;
  }

  // All nodes are flat (no parentId)
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const s of order) {
    nodes.push({
      id: nodeId(s),
      type: "state",
      position: { x: 0, y: 0 },
      data: { label: stateLabel(s), variant: stateVariant(s) },
    });
  }

  for (const e of allEdges) {
    const fromNid = nodeId(e.from);
    const toNid = nodeId(e.to);
    const isBack =
      (orderIndex.get(e.to) ?? 0) <= (orderIndex.get(e.from) ?? 0) &&
      e.from !== "_start";

    edges.push({
      id: `e_${fromNid}_${toNid}_${e.label}`,
      source: fromNid,
      target: toNid,
      label: e.label,
      sourceHandle: isBack ? "s-right" : "s-bottom",
      targetHandle: isBack ? "t-right" : "t-top",
    });
  }

  // Groups as post-layout overlays (not ELK compound nodes)
  const groups = useGroups
    ? [...fieldStates.entries()].map(([field, fieldStateNames]) => ({
        label: field,
        nodeIds: fieldStateNames.map((s) => nodeId(s)),
      }))
    : undefined;

  return {
    nodes,
    edges,
    direction: "DOWN",
    elkOptions: {
      "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
      "elk.spacing.nodeNode": "24",
      "elk.layered.spacing.nodeNodeBetweenLayers": "48",
    },
    groups,
  };
}
