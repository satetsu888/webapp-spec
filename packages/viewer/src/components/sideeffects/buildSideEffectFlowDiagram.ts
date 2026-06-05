import type { SideEffect, NotificationTarget } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function sanitizeId(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_");
}

function notifyKey(notify: NotificationTarget): string {
  if ("actor" in notify) return `actor_${notify.actor}`;
  if ("owner" in notify) return `owner_${notify.owner}`;
  return `ext_${notify.external}`;
}

function notifyLabel(notify: NotificationTarget): string {
  if ("actor" in notify) return `actor: ${notify.actor}`;
  if ("owner" in notify) return `owner: ${notify.owner}`;
  return `external: ${notify.external}`;
}

function notifyHref(notify: NotificationTarget): string | undefined {
  if ("owner" in notify) return `/domain/entities/${notify.owner}`;
  return undefined;
}

export function buildSideEffectFlowDiagram(sideEffects: SideEffect[]): FlowData | null {
  if (sideEffects.length === 0) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const operationIds = new Set<string>();
  const targetKeys = new Map<string, NotificationTarget>();

  for (const se of sideEffects) {
    operationIds.add(se.trigger.operation);
    const key = notifyKey(se.notify);
    if (!targetKeys.has(key)) {
      targetKeys.set(key, se.notify);
    }
  }

  for (const opId of operationIds) {
    nodes.push({
      id: `uc_${sanitizeId(opId)}`,
      type: "operation",
      position: { x: 0, y: 0 },
      data: { label: opId, href: `/operations/${opId}` },
    });
  }

  for (const [key, notify] of targetKeys) {
    nodes.push({
      id: `n_${sanitizeId(key)}`,
      type: "labeled",
      position: { x: 0, y: 0 },
      data: { label: notifyLabel(notify), href: notifyHref(notify) },
    });
  }

  for (const se of sideEffects) {
    const sourceId = `uc_${sanitizeId(se.trigger.operation)}`;
    const targetId = `n_${sanitizeId(notifyKey(se.notify))}`;
    edges.push({
      id: `e_${sourceId}_${targetId}_${sanitizeId(se.description)}`,
      source: sourceId,
      target: targetId,
      label: se.description,
    });
  }

  return { nodes, edges, direction: "RIGHT" };
}
