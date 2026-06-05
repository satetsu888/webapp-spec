import type { Component, View, Operation, SideEffect, NotificationTarget } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_");
}

function formatNotifyTarget(notify: NotificationTarget): string {
  if ("actor" in notify) return `actor: ${notify.actor}`;
  if ("owner" in notify) return `owner: ${notify.owner}`;
  return `external: ${notify.external}`;
}

const PARTITION = { actor: "0", view: "1", operation: "2", entity: "3", sideEffect: "4" } as const;

export function buildAppMapDiagram(
  components: Component[],
  views: View[],
  operations: Operation[],
  sideEffects: SideEffect[],
): FlowData | null {
  if (views.length === 0 && operations.length === 0) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedOperations = new Set<string>();
  const addedEntities = new Set<string>();
  const addedActors = new Set<string>();

  const operationMap = new Map(operations.map((o) => [o.id, o]));
  const componentMap = new Map(components.map((c) => [c.id, c]));

  function addActorNode(actorId: string): string {
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
    return actorNodeId;
  }

  function addEntityNode(entityId: string): string {
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
    return entityNodeId;
  }

  function addOperationNode(op: Operation): string {
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

      const entityNodeId = addEntityNode(op.target.entity);
      edges.push({
        id: `e_${opNodeId}_${entityNodeId}`,
        source: opNodeId,
        target: entityNodeId,
      });
    }
    return opNodeId;
  }

  for (const view of views) {
    const viewNodeId = `view_${sanitizeId(view.id)}`;

    nodes.push({
      id: viewNodeId,
      type: "group",
      position: { x: 0, y: 0 },
      data: {
        label: view.id,
        href: `/views/${view.id}`,
        _elkLayoutOptions: {
          "elk.direction": "DOWN",
          "elk.partitioning.partition": PARTITION.view,
        },
      },
    });

    for (const compRef of view.components) {
      if (!componentMap.has(compRef)) continue;
      const comp = componentMap.get(compRef)!;
      nodes.push({
        id: `comp_${sanitizeId(compRef)}_in_${sanitizeId(view.id)}`,
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

      const actorNodeId = addActorNode(op.actor);
      const opNodeId = addOperationNode(op);

      const sourcedComps = new Set<string>();
      for (const source of Object.values(action.inputFrom)) {
        const dotIndex = source.indexOf(".");
        if (dotIndex !== -1) sourcedComps.add(source.slice(0, dotIndex));
      }

      if (sourcedComps.size > 0) {
        for (const compId of sourcedComps) {
          const compNodeId = `comp_${sanitizeId(compId)}_in_${sanitizeId(view.id)}`;
          const edgeKey = `${actorNodeId}_${compNodeId}`;
          if (!addedActorEdges.has(edgeKey)) {
            addedActorEdges.add(edgeKey);
            edges.push({ id: `e_${edgeKey}`, source: actorNodeId, target: compNodeId });
          }
          edges.push({
            id: `e_${compNodeId}_${opNodeId}`,
            source: compNodeId,
            target: opNodeId,
          });
        }
      } else {
        const edgeKey = `${actorNodeId}_${viewNodeId}`;
        if (!addedActorEdges.has(edgeKey)) {
          addedActorEdges.add(edgeKey);
          edges.push({ id: `e_${edgeKey}`, source: actorNodeId, target: viewNodeId });
        }
        edges.push({
          id: `e_${viewNodeId}_${opNodeId}`,
          source: viewNodeId,
          target: opNodeId,
        });
      }
    }
  }

  for (const op of operations) {
    if (addedOperations.has(op.id)) continue;

    const actorNodeId = addActorNode(op.actor);
    const opNodeId = addOperationNode(op);
    edges.push({
      id: `e_${actorNodeId}_${opNodeId}`,
      source: actorNodeId,
      target: opNodeId,
    });
  }

  const seByOp = new Map<string, SideEffect[]>();
  for (const se of sideEffects) {
    const list = seByOp.get(se.trigger.operation) ?? [];
    list.push(se);
    seByOp.set(se.trigger.operation, list);
  }

  for (const [opId, ses] of seByOp) {
    if (!addedOperations.has(opId)) continue;
    const opNodeId = `op_${sanitizeId(opId)}`;

    for (let i = 0; i < ses.length; i++) {
      const se = ses[i];
      const seNodeId = `se_${sanitizeId(opId)}_${i}`;
      nodes.push({
        id: seNodeId,
        type: "labeled",
        position: { x: 0, y: 0 },
        data: {
          label: se.description,
          sublabel: formatNotifyTarget(se.notify),
          _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.sideEffect },
        },
      });
      edges.push({
        id: `e_${opNodeId}_${seNodeId}`,
        source: opNodeId,
        target: seNodeId,
        type: "dashed",
      });
    }
  }

  if (nodes.length === 0) return null;

  return {
    nodes,
    edges,
    direction: "RIGHT",
    elkOptions: { "elk.partitioning.activate": "true" },
    maxHeight: 1200,
  };
}
