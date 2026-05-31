import type { SideEffect, NotificationTarget } from "@webapp-spec/types";

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;");
}

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

export function buildSideEffectFlowDiagram(sideEffects: SideEffect[]): string | null {
  if (sideEffects.length === 0) return null;

  const lines = ["flowchart LR"];
  const clicks: string[] = [];

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
    const nodeId = `uc_${sanitizeId(opId)}`;
    lines.push(`    ${nodeId}(["${escapeLabel(opId)}"])`);
    clicks.push(`    click ${nodeId} href "/usecases/operations/${opId}"`);
  }

  for (const [key, notify] of targetKeys) {
    const nodeId = `n_${sanitizeId(key)}`;
    lines.push(`    ${nodeId}["${escapeLabel(notifyLabel(notify))}"]`);
    if ("owner" in notify) {
      clicks.push(`    click ${nodeId} href "/domain/entities/${notify.owner}"`);
    }
  }

  for (const se of sideEffects) {
    const ucNode = `uc_${sanitizeId(se.trigger.operation)}`;
    const nNode = `n_${sanitizeId(notifyKey(se.notify))}`;
    lines.push(`    ${ucNode} -->|"${escapeLabel(se.description)}"| ${nNode}`);
  }

  lines.push(...clicks);
  return lines.join("\n");
}
