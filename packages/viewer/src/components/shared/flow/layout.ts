import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";

const elk = new ELK();

function estimateTextWidth(text: string, charWidth: number): number {
  let width = 0;
  for (const ch of text) {
    width += ch.charCodeAt(0) > 0x7f ? charWidth * 1.8 : charWidth;
  }
  return width;
}

function estimateMultiLineWidth(text: string, charWidth: number): number {
  return Math.max(...text.split("\n").map((line) => estimateTextWidth(line, charWidth)));
}

const NODE_SIZES: Record<string, (data: Record<string, unknown>) => { width: number; height: number }> = {
  entitySchema: (data) => ({
    width: 220,
    height: 36 + ((data.fields as unknown[]) ?? []).length * 28,
  }),
  state: (data) => {
    const variant = data.variant as string;
    return variant === "start" || variant === "end"
      ? { width: 20, height: 20 }
      : { width: Math.max(100, estimateTextWidth((data.label as string) ?? "", 9) + 24), height: 40 };
  },
  actor: () => ({ width: 80, height: 72 }),
  operation: (data) => ({
    width: Math.max(160, estimateMultiLineWidth((data.label as string) ?? "", 7.5) + 32),
    height: 40,
  }),
  labeled: (data) => {
    const label = (data.label as string) ?? "";
    const sublabel = (data.sublabel as string) ?? "";
    const lines = label.split("\n").length + (sublabel ? sublabel.split("\n").length : 0);
    const maxLineWidth = Math.max(
      estimateMultiLineWidth(label, 7.5),
      sublabel ? estimateMultiLineWidth(sublabel, 7) : 0,
    );
    return { width: Math.max(180, maxLineWidth + 32), height: 28 + lines * 18 };
  },
  group: () => ({ width: 0, height: 0 }),
};

function estimateSize(node: Node): { width: number; height: number } {
  const fn = NODE_SIZES[node.type ?? ""];
  if (fn) return fn(node.data as Record<string, unknown>);
  return { width: 160, height: 40 };
}

export async function computeLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "RIGHT" | "DOWN" = "DOWN",
  elkOptions?: Record<string, string>,
  groups?: { label: string; nodeIds: string[] }[],
): Promise<{ nodes: Node[]; edges: Edge[]; width: number; height: number }> {
  const parentIds = new Set(
    groups && groups.length > 0
      ? []
      : nodes.filter((n) => n.type === "group").map((n) => n.id),
  );

  const rootChildren: ElkNode[] = [];
  const groupChildrenMap = new Map<string, ElkNode[]>();

  for (const pid of parentIds) {
    groupChildrenMap.set(pid, []);
  }

  for (const node of nodes) {
    if (parentIds.has(node.id)) continue;
    const size = estimateSize(node);
    const nodeElkOptions = (node.data as Record<string, unknown>)._elkLayoutOptions as Record<string, string> | undefined;
    const elkNode: ElkNode = { id: node.id, width: size.width, height: size.height, ...(nodeElkOptions && { layoutOptions: nodeElkOptions }) };

    const pid = node.parentId;
    if (pid && groupChildrenMap.has(pid)) {
      groupChildrenMap.get(pid)!.push(elkNode);
    } else {
      rootChildren.push(elkNode);
    }
  }

  for (const pid of parentIds) {
    const groupNode = nodes.find((n) => n.id === pid)!;
    const groupData = groupNode.data as Record<string, unknown>;
    const label = groupData.label as string ?? "";
    const groupElkOptions = groupData._elkLayoutOptions as Record<string, string> | undefined;
    rootChildren.push({
      id: pid,
      layoutOptions: {
        "elk.padding": "[top=24,left=16,bottom=16,right=16]",
        "elk.algorithm": "layered",
        "elk.direction": direction,
        "elk.spacing.nodeNode": "24",
        "elk.layered.spacing.nodeNodeBetweenLayers": "40",
        ...groupElkOptions,
      },
      children: groupChildrenMap.get(pid) ?? [],
      labels: label ? [{ text: label }] : undefined,
    });
  }

  const elkEdges: ElkExtendedEdge[] = edges.map((e) => {
    const edge: ElkExtendedEdge = {
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    };
    if (e.label && typeof e.label === "string") {
      edge.labels = [{ text: e.label, width: estimateTextWidth(e.label, 7) + 16, height: 20 }];
    }
    return edge;
  });

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "32",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.layered.spacing.edgeNodeBetweenLayers": "24",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.edgeLabels.inline": "false",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      ...elkOptions,
    },
    children: rootChildren,
    edges: elkEdges,
  };

  const layouted = await elk.layout(graph);

  const posMap = new Map<string, { x: number; y: number; width?: number; height?: number }>();

  for (const child of layouted.children ?? []) {
    posMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0, width: child.width, height: child.height });
    if (child.children) {
      for (const grandchild of child.children) {
        posMap.set(grandchild.id, { x: grandchild.x ?? 0, y: grandchild.y ?? 0 });
      }
    }
  }

  const layoutedNodes = nodes
    .filter((n) => !(groups && groups.length > 0 && n.type === "group"))
    .map((node) => {
      const pos = posMap.get(node.id);
      if (!pos) return node;

      const result = { ...node, position: { x: pos.x, y: pos.y } };
      if (node.type === "group" && pos.width && pos.height) {
        result.style = { ...((node.style as Record<string, unknown>) ?? {}), width: pos.width, height: pos.height };
      }
      return result;
    });

  if (groups && groups.length > 0) {
    const sizeMap = new Map<string, { width: number; height: number }>();
    for (const node of nodes) {
      sizeMap.set(node.id, estimateSize(node));
    }

    const groupOverlays: Node[] = [];
    for (const group of groups) {
      const rects = group.nodeIds
        .map((id) => {
          const pos = posMap.get(id);
          const size = sizeMap.get(id);
          if (!pos || !size) return null;
          return { x: pos.x, y: pos.y, w: size.width, h: size.height };
        })
        .filter(Boolean) as { x: number; y: number; w: number; h: number }[];

      if (rects.length === 0) continue;

      const pad = { top: 28, left: 16, bottom: 16, right: 16 };
      const minX = Math.min(...rects.map((r) => r.x)) - pad.left;
      const minY = Math.min(...rects.map((r) => r.y)) - pad.top;
      const maxX = Math.max(...rects.map((r) => r.x + r.w)) + pad.right;
      const maxY = Math.max(...rects.map((r) => r.y + r.h)) + pad.bottom;

      groupOverlays.push({
        id: `overlay_${group.label}`,
        type: "group",
        position: { x: minX, y: minY },
        style: { width: maxX - minX, height: maxY - minY, zIndex: -1 },
        data: {},
      });
      groupOverlays.push({
        id: `overlaylabel_${group.label}`,
        type: "groupLabel",
        position: { x: minX + 12, y: minY - 10 },
        style: { zIndex: 1 },
        data: { label: group.label },
      });
    }

    layoutedNodes.unshift(...groupOverlays);
  }

  return {
    nodes: layoutedNodes,
    edges,
    width: layouted.width ?? 0,
    height: layouted.height ?? 0,
  };
}
