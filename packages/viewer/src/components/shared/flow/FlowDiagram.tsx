import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ReactFlow, MarkerType, type Node, type Edge, type NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FlowData } from "./types";
import { computeLayout } from "./layout";
import { EntitySchemaNode } from "./nodes/EntitySchemaNode";
import { StateNode } from "./nodes/StateNode";
import { ActorNode } from "./nodes/ActorNode";
import { OperationNode } from "./nodes/OperationNode";
import { LabeledNode } from "./nodes/LabeledNode";
import { GroupNode, GroupLabelNode } from "./nodes/GroupNode";
import { DashedEdge } from "./edges/DashedEdge";
import { RelationEdge } from "./edges/RelationEdge";

const nodeTypes = {
  entitySchema: EntitySchemaNode,
  state: StateNode,
  actor: ActorNode,
  operation: OperationNode,
  labeled: LabeledNode,
  group: GroupNode,
  groupLabel: GroupLabelNode,
};

const edgeTypes = {
  dashed: DashedEdge,
  relation: RelationEdge,
};

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  style: { stroke: "#9ca3af" },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af", width: 16, height: 16 },
};

type Props = {
  data: FlowData;
};

export function FlowDiagram({ data }: Props) {
  const navigate = useNavigate();
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([]);
  const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([]);
  const [containerHeight, setContainerHeight] = useState(400);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stableKey = useMemo(
    () => JSON.stringify(data.nodes.map((n) => n.id).concat(data.edges.map((e) => e.id))),
    [data.nodes, data.edges],
  );

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    const dir = data.direction ?? "DOWN";
    computeLayout(data.nodes, data.edges, dir, data.elkOptions, data.groups).then((result) => {
      if (cancelled) return;
      const nodesWithDirection = result.nodes.map((n) => ({
        ...n,
        data: { ...n.data, _direction: dir },
      }));
      setLayoutedNodes(nodesWithDirection);
      setLayoutedEdges(result.edges);
      const maxH = data.maxHeight ?? 800;
      setContainerHeight(Math.max(300, Math.min(result.height + 80, maxH)));
      setReady(true);
    });

    return () => { cancelled = true; };
  }, [stableKey, data.direction]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const href = (node.data as Record<string, unknown>).href as string | undefined;
      if (href) navigate(href);
    },
    [navigate],
  );

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const displayEdges = useMemo(() => {
    if (!hoveredNodeId) return layoutedEdges;
    return layoutedEdges.map((edge) => {
      const connected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      return {
        ...edge,
        style: {
          ...(edge.style ?? {}),
          opacity: connected ? 1 : 0.15,
          filter: connected ? "drop-shadow(0 0 3px #3b82f6)" : undefined,
        },
      };
    });
  }, [layoutedEdges, hoveredNodeId]);

  if (!ready) {
    return <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  const hasClickable = layoutedNodes.some((n) => (n.data as Record<string, unknown>).href);

  return (
    <div className="rounded border border-gray-200 bg-white" style={{ height: containerHeight }}>
      <ReactFlow
        nodes={layoutedNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={hasClickable ? onNodeClick : undefined}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
