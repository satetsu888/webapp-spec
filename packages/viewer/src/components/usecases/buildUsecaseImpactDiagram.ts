import type { Usecase, Transition, Reaction, NotificationTarget } from "@webapp-spec/types";

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

export function buildUsecaseImpactDiagram(
  usecase: Usecase,
  transitionMap: Map<string, Transition>,
  reactions: Reaction[],
): string | null {
  const transition = usecase.transition
    ? transitionMap.get(usecase.transition)
    : undefined;

  const lines = ["flowchart LR"];
  const clicks: string[] = [];

  lines.push(`    actor@{ shape: icon, icon: "spec:actor", label: "${escapeLabel(usecase.actor)}" }`);
  lines.push(`    uc(["${escapeLabel(usecase.id)}"])`);

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
    lines.push(`    target["${escapeLabel(usecase.target.entity)}"]`);
    clicks.push(`    click target href "/entities/${usecase.target.entity}"`);
  }

  for (let i = 0; i < reactions.length; i++) {
    const r = reactions[i];
    const target = formatNotifyTarget(r.notify);
    lines.push(`    r${i}(["${escapeLabel(target)}\\n${escapeLabel(r.description)}"])`);
  }

  if (usecase.followUps) {
    for (let i = 0; i < usecase.followUps.length; i++) {
      const fu = usecase.followUps[i];
      lines.push(`    fu${i}(["${escapeLabel(fu.usecase)}\\n${escapeLabel(fu.description)}"])`);
      clicks.push(`    click fu${i} href "/usecases/${fu.usecase}"`);
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
  for (let i = 0; i < reactions.length; i++) {
    lines.push(`    uc -.-> r${i}`);
  }
  if (usecase.followUps) {
    for (let i = 0; i < usecase.followUps.length; i++) {
      lines.push(`    uc -.-> fu${i}`);
    }
  }

  lines.push(...clicks);
  return lines.join("\n");
}
