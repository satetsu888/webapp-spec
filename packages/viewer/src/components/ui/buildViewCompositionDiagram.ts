import type { View, Component, Operation } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_");
}

const PARTITION = { actor: "0", view: "1", operation: "2", entity: "3" } as const;

export function buildViewCompositionDiagram(
  view: View,
  componentMap: Map<string, Component>,
  operationMap: Map<string, Operation>,
): FlowData | null {
  if (view.actions.length === 0 && view.components.length === 0) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedActors = new Set<string>();
  const addedOperations = new Set<string>();
  const addedEntities = new Set<string>();

  const viewNodeId = `view_${sanitizeId(view.id)}`;
  nodes.push({
    id: viewNodeId,
    type: "group",
    position: { x: 0, y: 0 },
    data: {
      label: view.id,
      _elkLayoutOptions: {
        "elk.direction": "DOWN",
        "elk.partitioning.partition": PARTITION.view,
      },
    },
  });

  for (const compRef of view.components) {
    const comp = componentMap.get(compRef);
    if (!comp) continue;
    nodes.push({
      id: `comp_${sanitizeId(compRef)}`,
      type: "labeled",
      position: { x: 0, y: 0 },
      parentId: viewNodeId,
      extent: "parent" as const,
      data: { label: comp.id, sublabel: comp.description },
    });
  }

  const addedActorEdges = new Set<string>();

  for (const action of view.actions) {
    const op = operationMap.get(action.operation);
    if (!op) continue;

    const actorId = op.actor;
    const actorNodeId = `actor_${sanitizeId(actorId)}`;
    if (!addedActors.has(actorId)) {
      addedActors.add(actorId);
      nodes.push({
        id: actorNodeId,
        type: "actor",
        position: { x: 0, y: 0 },
        data: {
          label: actorId,
          _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.actor },
        },
      });
    }

    const opNodeId = `op_${sanitizeId(op.id)}`;
    if (!addedOperations.has(op.id)) {
      addedOperations.add(op.id);
      nodes.push({
        id: opNodeId,
        type: "labeled",
        position: { x: 0, y: 0 },
        data: {
          label: op.description,
          sublabel: op.id,
          href: `/operations/${op.id}`,
          _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.operation },
        },
      });

      const entityId = op.target.entity;
      const entityNodeId = `entity_${sanitizeId(entityId)}`;
      if (!addedEntities.has(entityId)) {
        addedEntities.add(entityId);
        nodes.push({
          id: entityNodeId,
          type: "labeled",
          position: { x: 0, y: 0 },
          data: {
            label: entityId,
            variant: "entity",
            href: `/domain/entities/${entityId}`,
            _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.entity },
          },
        });
      }
      edges.push({
        id: `e_${opNodeId}_${entityNodeId}`,
        source: opNodeId,
        target: entityNodeId,
      });
    }

    const sourcedComps = new Set<string>();
    for (const source of Object.values(action.inputFrom)) {
      const dotIndex = source.indexOf(".");
      if (dotIndex !== -1) sourcedComps.add(source.slice(0, dotIndex));
    }

    if (sourcedComps.size > 0) {
      for (const compId of sourcedComps) {
        const compNodeId = `comp_${sanitizeId(compId)}`;
        const actorEdgeKey = `${actorNodeId}_${compNodeId}`;
        if (!addedActorEdges.has(actorEdgeKey)) {
          addedActorEdges.add(actorEdgeKey);
          edges.push({ id: `e_${actorEdgeKey}`, source: actorNodeId, target: compNodeId });
        }
        edges.push({
          id: `e_${compNodeId}_${opNodeId}`,
          source: compNodeId,
          target: opNodeId,
        });
      }
    } else {
      const actorEdgeKey = `${actorNodeId}_${viewNodeId}`;
      if (!addedActorEdges.has(actorEdgeKey)) {
        addedActorEdges.add(actorEdgeKey);
        edges.push({ id: `e_${actorEdgeKey}`, source: actorNodeId, target: viewNodeId });
      }
      edges.push({
        id: `e_${viewNodeId}_${opNodeId}`,
        source: viewNodeId,
        target: opNodeId,
      });
    }
  }

  return {
    nodes,
    edges,
    direction: "RIGHT",
    elkOptions: { "elk.partitioning.activate": "true" },
  };
}
