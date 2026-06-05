import type { Actor, Operation, SideEffect, Transition, NotificationTarget } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function formatNotifyTarget(notify: NotificationTarget): string {
  if ("actor" in notify) return `actor: ${notify.actor}`;
  if ("owner" in notify) return `owner: ${notify.owner}`;
  return `external: ${notify.external}`;
}

function collectEntities(op: Operation, transitionMap: Map<string, Transition>): string[] {
  const entities = new Set<string>();
  entities.add(op.target.entity);

  if (op.transition) {
    const tr = transitionMap.get(op.transition);
    if (tr) {
      for (const ch of tr.changes) {
        entities.add(ch.entity);
      }
    }
  }

  return [...entities];
}

export function buildActorOperationDiagram(
  actors: Actor[],
  operations: Operation[],
  sideEffects: SideEffect[],
  transitionMap: Map<string, Transition>,
): FlowData | null {
  if (operations.length === 0) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedEntityNodes = new Set<string>();

  const opsByActor = new Map<string, Operation[]>();
  for (const op of operations) {
    const list = opsByActor.get(op.actor) ?? [];
    list.push(op);
    opsByActor.set(op.actor, list);
  }

  for (const actor of actors) {
    const ops = opsByActor.get(actor.id);
    if (!ops || ops.length === 0) continue;

    nodes.push({
      id: `actor_${actor.id}`,
      type: "actor",
      position: { x: 0, y: 0 },
      data: { label: actor.id },
    });

    for (const op of ops) {
      const opNodeId = `op_${op.id}`;
      if (!nodes.some((n) => n.id === opNodeId)) {
        nodes.push({
          id: opNodeId,
          type: "labeled",
          position: { x: 0, y: 0 },
          data: { label: op.description, sublabel: op.id, href: `/operations/${op.id}` },
        });
      }
      edges.push({
        id: `e_${actor.id}_${op.id}`,
        source: `actor_${actor.id}`,
        target: opNodeId,
      });

      for (const entityId of collectEntities(op, transitionMap)) {
        const entityNodeId = `entity_${entityId}`;
        if (!addedEntityNodes.has(entityId)) {
          addedEntityNodes.add(entityId);
          nodes.push({
            id: entityNodeId,
            type: "labeled",
            position: { x: 0, y: 0 },
            data: { label: entityId, variant: "entity", href: `/domain/entities/${entityId}` },
          });
        }
        edges.push({
          id: `e_${op.id}_${entityId}`,
          source: opNodeId,
          target: entityNodeId,
        });
      }
    }
  }

  const seByOp = new Map<string, SideEffect[]>();
  for (const se of sideEffects) {
    const list = seByOp.get(se.trigger.operation) ?? [];
    list.push(se);
    seByOp.set(se.trigger.operation, list);
  }

  for (const [opId, ses] of seByOp) {
    const opNodeId = `op_${opId}`;
    if (!nodes.some((n) => n.id === opNodeId)) continue;

    for (let i = 0; i < ses.length; i++) {
      const se = ses[i];
      const seNodeId = `se_${opId}_${i}`;
      nodes.push({
        id: seNodeId,
        type: "labeled",
        position: { x: 0, y: 0 },
        data: { label: se.description, sublabel: formatNotifyTarget(se.notify) },
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

  return { nodes, edges, direction: "RIGHT" };
}
