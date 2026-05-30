import type { Scenario, ViewStep, BackgroundStep } from "@webapp-spec/types";

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;");
}

type StepGroup =
  | { kind: "view"; view: string; items: { index: number; step: ViewStep }[] }
  | { kind: "background"; index: number; step: BackgroundStep }
  | { kind: "ref"; index: number; scenarioId: string };

function groupStepsByView(steps: Scenario["steps"]): StepGroup[] {
  const groups: StepGroup[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (typeof step === "string") {
      groups.push({ kind: "ref", index: i, scenarioId: step });
    } else if ("view" in step) {
      const last = groups[groups.length - 1];
      if (last && last.kind === "view" && last.view === step.view) {
        last.items.push({ index: i, step });
      } else {
        groups.push({ kind: "view", view: step.view, items: [{ index: i, step }] });
      }
    } else {
      groups.push({ kind: "background", index: i, step });
    }
  }

  return groups;
}

function buildFlowFromSteps(
  steps: Scenario["steps"],
  idPrefix: string,
): string[] {
  const groups = groupStepsByView(steps);
  const lines: string[] = [];
  const allIds: string[] = [];
  const clicks: string[] = [];
  let sgIndex = 0;

  for (const group of groups) {
    if (group.kind === "view") {
      const sgId = `${idPrefix}sg${sgIndex++}`;
      lines.push(`    subgraph ${sgId}["${escapeLabel(group.view)}"]`);
      for (const { index, step } of group.items) {
        const id = `${idPrefix}s${index}`;
        allIds.push(id);
        lines.push(`        ${id}["${escapeLabel(step.description)}"]`);
        if (step.action) {
          clicks.push(`    click ${id} href "/operations/${step.action}"`);
        }
      }
      lines.push(`    end`);
      clicks.push(`    click ${sgId} href "/views/${group.view}"`);
    } else if (group.kind === "background") {
      const id = `${idPrefix}s${group.index}`;
      allIds.push(id);
      const label = `${group.step.actor}: ${group.step.description}`;
      lines.push(`    ${id}(["${escapeLabel(label)}"])`);
      clicks.push(`    click ${id} href "/operations/${group.step.operation}"`);
    } else {
      const id = `${idPrefix}s${group.index}`;
      allIds.push(id);
      lines.push(`    ${id}{{"${escapeLabel(group.scenarioId)}"}}`);
      clicks.push(`    click ${id} href "/scenarios/${group.scenarioId}"`);
    }
  }

  for (let i = 0; i < allIds.length - 1; i++) {
    lines.push(`    ${allIds[i]} --> ${allIds[i + 1]}`);
  }

  lines.push(...clicks);
  return lines;
}

export function buildScenarioFlowDiagram(
  scenario: Scenario,
): string | null {
  if (scenario.steps.length === 0) return null;

  const lines = ["flowchart TD"];
  lines.push(...buildFlowFromSteps(scenario.steps, ""));

  if (scenario.variants) {
    for (let v = 0; v < scenario.variants.length; v++) {
      const variant = scenario.variants[v];
      if (variant.steps.length === 0) continue;
      const label = escapeLabel(`${variant.id}: ${variant.goal}`);
      lines.push(`    subgraph vg${v}["${label}"]`);
      lines.push(...buildFlowFromSteps(variant.steps, `v${v}`));
      lines.push(`    end`);
    }
  }

  return lines.join("\n");
}
