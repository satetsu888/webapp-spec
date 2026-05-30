import type { Operation, Transition, SideEffect, NotificationTarget } from "@webapp-spec/types";

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;");
}

function formatState(state: string): string {
  if (state === "_start") return "(new)";
  if (state === "_end") return "(end)";
  return state;
}

function formatNotifyTarget(notify: NotificationTarget): string {
  if ("actor" in notify) return `actor: ${notify.actor}`;
  if ("owner" in notify) return `owner: ${notify.owner}`;
  return `external: ${notify.external}`;
}

export function buildOperationImpactDiagram(
  operation: Operation,
  transitionMap: Map<string, Transition>,
  sideEffects: SideEffect[],
): string | null {
  const transition = operation.transition
    ? transitionMap.get(operation.transition)
    : undefined;

  const lines = ["flowchart LR"];
  const clicks: string[] = [];

  lines.push(`    actor@{ shape: icon, icon: "spec:actor", label: "${escapeLabel(operation.actor)}" }`);
  lines.push(`    uc(["${escapeLabel(operation.id)}"])`);

  if (transition && transition.changes.length > 0) {
    for (let i = 0; i < transition.changes.length; i++) {
      const ch = transition.changes[i];
      const from = formatState(ch.state.from);
      const to = formatState(ch.state.to);
      const scope = ch.scope === "related" ? " (related)" : "";
      lines.push(`    c${i}["${escapeLabel(ch.entity)}\\n${escapeLabel(from)} → ${escapeLabel(to)}${escapeLabel(scope)}"]`);
      clicks.push(`    click c${i} href "/entities/${ch.entity}"`);
    }
  } else {
    lines.push(`    target["${escapeLabel(operation.target.entity)}"]`);
    clicks.push(`    click target href "/entities/${operation.target.entity}"`);
  }

  for (let i = 0; i < sideEffects.length; i++) {
    const se = sideEffects[i];
    const target = formatNotifyTarget(se.notify);
    lines.push(`    r${i}(["${escapeLabel(target)}\\n${escapeLabel(se.description)}"])`);
  }

  if (operation.followUps) {
    for (let i = 0; i < operation.followUps.length; i++) {
      const fu = operation.followUps[i];
      lines.push(`    fu${i}(["${escapeLabel(fu.operation)}\\n${escapeLabel(fu.description)}"])`);
      clicks.push(`    click fu${i} href "/operations/${fu.operation}"`);
    }
  }

  lines.push(`    actor --> uc`);
  if (transition && transition.changes.length > 0) {
    for (let i = 0; i < transition.changes.length; i++) {
      lines.push(`    uc --> c${i}`);
    }
  } else {
    lines.push(`    uc --> target`);
  }
  for (let i = 0; i < sideEffects.length; i++) {
    lines.push(`    uc -.-> r${i}`);
  }
  if (operation.followUps) {
    for (let i = 0; i < operation.followUps.length; i++) {
      lines.push(`    uc -.-> fu${i}`);
    }
  }

  lines.push(...clicks);
  return lines.join("\n");
}
