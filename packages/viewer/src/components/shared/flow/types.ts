import type { Node, Edge } from "@xyflow/react";

export type FlowData = {
  nodes: Node[];
  edges: Edge[];
  direction?: "RIGHT" | "DOWN";
  elkOptions?: Record<string, string>;
  groups?: { label: string; nodeIds: string[] }[];
  maxHeight?: number;
};
