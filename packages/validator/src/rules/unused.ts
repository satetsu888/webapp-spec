import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkUnused(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Collect all references
  const referencedTransitions = new Set(spec.usecases.map((u) => u.transition));

  const referencedActors = new Set([
    ...spec.usecases.map((u) => u.actor),
    ...spec.journeys.map((j) => j.actor),
  ]);

  const referencedUsecases = new Set([
    ...spec.usecases.flatMap((u) => u.followUps?.map((f) => f.usecase) ?? []),
    ...spec.journeys.flatMap((j) =>
      j.steps.filter((s): s is { usecase: string } => typeof s !== "string").map((s) => s.usecase),
    ),
    ...spec.reactions.map((r) => r.trigger.usecase),
    ...spec.ui.views.flatMap((v) => v.actions.map((a) => a.usecase)),
  ]);

  const referencedComponents = new Set(
    spec.ui.views.flatMap((v) => v.components),
  );

  const referencedEntities = new Set([
    ...spec.domain.relations.flatMap((r) => [r.from, r.to]),
    ...spec.domain.transitions.flatMap((t) => t.changes.map((c) => c.entity)),
    ...spec.usecases.map((u) => u.target.entity),
    ...spec.reactions.map((r) => r.trigger.entity),
    ...spec.ui.components.flatMap((c) => c.sources.map((s) => s.entity)),
  ]);

  // Unused transitions
  for (const tr of spec.domain.transitions) {
    if (!referencedTransitions.has(tr.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.transition",
        message: `Transition "${tr.id}" is not referenced by any Usecase`,
        path: `domain.transitions`,
      });
    }
  }

  // Unused actors
  for (const actor of spec.actors) {
    if (!referencedActors.has(actor.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.actor",
        message: `Actor "${actor.id}" is not referenced by any Usecase or Journey`,
        path: `actors`,
      });
    }
  }

  // Unused usecases
  for (const uc of spec.usecases) {
    if (!referencedUsecases.has(uc.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.usecase",
        message: `Usecase "${uc.id}" is not referenced by any Journey, View, Reaction, or followUp`,
        path: `usecases`,
      });
    }
  }

  // Unused components
  for (const comp of spec.ui.components) {
    if (!referencedComponents.has(comp.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.component",
        message: `Component "${comp.id}" is not referenced by any View`,
        path: `ui.components`,
      });
    }
  }

  // Unused entities
  for (const entity of spec.domain.entities) {
    if (!referencedEntities.has(entity.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.entity",
        message: `Entity "${entity.id}" is not referenced anywhere`,
        path: `domain.entities`,
      });
    }
  }

  return issues;
}
