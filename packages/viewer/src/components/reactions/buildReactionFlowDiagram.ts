import type { Reaction, NotificationTarget } from "@webapp-spec/types";

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

export function buildReactionFlowDiagram(reactions: Reaction[]): string | null {
  if (reactions.length === 0) return null;

  const lines = ["flowchart LR"];
  const clicks: string[] = [];

  const usecaseIds = new Set<string>();
  const targetKeys = new Map<string, NotificationTarget>();

  for (const r of reactions) {
    usecaseIds.add(r.trigger.usecase);
    const key = notifyKey(r.notify);
    if (!targetKeys.has(key)) {
      targetKeys.set(key, r.notify);
    }
  }

  for (const ucId of usecaseIds) {
    const nodeId = `uc_${sanitizeId(ucId)}`;
    lines.push(`    ${nodeId}(["${escapeLabel(ucId)}"])`);
    clicks.push(`    click ${nodeId} href "/usecases/${ucId}"`);
  }

  for (const [key, notify] of targetKeys) {
    const nodeId = `n_${sanitizeId(key)}`;
    lines.push(`    ${nodeId}["${escapeLabel(notifyLabel(notify))}"]`);
    if ("owner" in notify) {
      clicks.push(`    click ${nodeId} href "/entities/${notify.owner}"`);
    }
  }

  for (const r of reactions) {
    const ucNode = `uc_${sanitizeId(r.trigger.usecase)}`;
    const nNode = `n_${sanitizeId(notifyKey(r.notify))}`;
    lines.push(`    ${ucNode} -->|"${escapeLabel(r.description)}"| ${nNode}`);
  }

  lines.push(...clicks);
  return lines.join("\n");
}
