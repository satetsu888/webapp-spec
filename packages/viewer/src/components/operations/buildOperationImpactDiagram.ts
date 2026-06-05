import type { Operation, SideEffect, View, Component, NotificationTarget } from "@webapp-spec/types";
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

const PARTITION = { actor: "0", view: "1", operation: "2", entity: "3", extra: "4" } as const;

export function buildOperationImpactDiagram(
  operation: Operation,
  views: View[],
  componentMap: Map<string, Component>,
  sideEffects: SideEffect[],
): FlowData | null {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "actor",
    type: "actor",
    position: { x: 0, y: 0 },
    data: {
      label: operation.actor,
      _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.actor },
    },
  });

  const opNodeId = "op";
  nodes.push({
    id: opNodeId,
    type: "labeled",
    position: { x: 0, y: 0 },
    data: {
      label: operation.description,
      sublabel: operation.id,
      _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.operation },
    },
  });

  const relevantViews = views.filter((v) =>
    v.actions.some((a) => a.operation === operation.id),
  );

  if (relevantViews.length > 0) {
    for (const view of relevantViews) {
      const viewNodeId = `view_${sanitizeId(view.id)}`;

      const relevantActions = view.actions.filter(
        (a) => a.operation === operation.id,
      );

      const usedCompIds = new Set<string>();
      for (const action of relevantActions) {
        for (const source of Object.values(action.inputFrom)) {
          const dotIndex = source.indexOf(".");
          if (dotIndex !== -1) usedCompIds.add(source.slice(0, dotIndex));
        }
      }

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

      for (const compId of usedCompIds) {
        const comp = componentMap.get(compId);
        if (!comp) continue;
        const compNodeId = `comp_${sanitizeId(compId)}_in_${sanitizeId(view.id)}`;
        nodes.push({
          id: compNodeId,
          type: "labeled",
          position: { x: 0, y: 0 },
          parentId: viewNodeId,
          extent: "parent" as const,
          data: { label: comp.id, sublabel: comp.description },
        });
        edges.push({ id: `e_actor_${compNodeId}`, source: "actor", target: compNodeId });
        edges.push({ id: `e_${compNodeId}_op`, source: compNodeId, target: opNodeId });
      }

      if (usedCompIds.size === 0) {
        edges.push({ id: `e_actor_${viewNodeId}`, source: "actor", target: viewNodeId });
        edges.push({ id: `e_${viewNodeId}_op`, source: viewNodeId, target: opNodeId });
      }
    }
  } else {
    edges.push({ id: "e_actor_op", source: "actor", target: opNodeId });
  }

  const entityNodeId = `entity_${sanitizeId(operation.target.entity)}`;
  nodes.push({
    id: entityNodeId,
    type: "labeled",
    position: { x: 0, y: 0 },
    data: {
      label: operation.target.entity,
      variant: "entity",
      href: `/domain/entities/${operation.target.entity}`,
      _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.entity },
    },
  });
  edges.push({ id: "e_op_entity", source: opNodeId, target: entityNodeId });

  for (let i = 0; i < sideEffects.length; i++) {
    const se = sideEffects[i];
    const seNodeId = `se${i}`;
    nodes.push({
      id: seNodeId,
      type: "labeled",
      position: { x: 0, y: 0 },
      data: {
        label: se.description,
        sublabel: formatNotifyTarget(se.notify),
        _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.extra },
      },
    });
    edges.push({ id: `e_op_${seNodeId}`, source: opNodeId, target: seNodeId, type: "dashed" });
  }

  if (operation.followUps) {
    for (let i = 0; i < operation.followUps.length; i++) {
      const fu = operation.followUps[i];
      const fuNodeId = `fu${i}`;
      nodes.push({
        id: fuNodeId,
        type: "labeled",
        position: { x: 0, y: 0 },
        data: {
          label: fu.description,
          sublabel: fu.operation,
          href: `/operations/${fu.operation}`,
          _elkLayoutOptions: { "elk.partitioning.partition": PARTITION.extra },
        },
      });
      edges.push({ id: `e_op_${fuNodeId}`, source: opNodeId, target: fuNodeId, type: "dashed" });
    }
  }

  return {
    nodes,
    edges,
    direction: "RIGHT",
    elkOptions: { "elk.partitioning.activate": "true" },
  };
}
