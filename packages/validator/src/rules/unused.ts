import type { WebAppSpec, BackgroundStep, ViewStep } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkUnused(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Collect all references
  const referencedTransitions = new Set(spec.usecases.operations.map((u) => u.transition).filter(Boolean));

  const referencedActors = new Set([
    ...spec.usecases.operations.map((u) => u.actor),
    ...spec.scenarios.map((s) => s.actor),
    ...spec.scenarios.flatMap((s) =>
      s.steps.filter((step): step is BackgroundStep => typeof step !== "string" && "operation" in step).map((step) => step.actor),
    ),
  ]);

  const referencedOperations = new Set([
    ...spec.usecases.operations.flatMap((u) => u.followUps?.map((f) => f.operation) ?? []),
    ...spec.scenarios.flatMap((s) =>
      s.steps.flatMap((step) => {
        if (typeof step === "string") return [];
        if ("view" in step) return step.action ? [step.action] : [];
        return [step.operation];
      }),
    ),
    ...spec.usecases.sideEffects.map((se) => se.trigger.operation),
    ...spec.ui.views.flatMap((v) => v.actions.map((a) => a.operation)),
  ]);

  const referencedComponents = new Set(
    spec.ui.views.flatMap((v) => v.components),
  );

  const referencedEntities = new Set([
    ...spec.domain.relations.flatMap((r) => [r.from, r.to]),
    ...spec.domain.transitions.flatMap((t) => t.changes.map((c) => c.entity)),
    ...spec.usecases.operations.map((u) => u.target.entity),
    ...spec.usecases.sideEffects.map((se) => se.trigger.entity),
    ...spec.ui.components.flatMap((c) => c.sources.map((s) => s.entity)),
  ]);

  const referencedViews = new Set([
    ...spec.scenarios.flatMap((s) =>
      s.steps.filter((step): step is ViewStep => typeof step !== "string" && "view" in step).map((step) => step.view),
    ),
  ]);

  // Unused transitions
  for (const tr of spec.domain.transitions) {
    if (!referencedTransitions.has(tr.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.transition",
        message: `Transition "${tr.id}" is not referenced by any Operation`,
        path: `domain.transitions`,
      });
    }
  }

  // Unused actors
  for (const actor of spec.usecases.actors) {
    if (!referencedActors.has(actor.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.actor",
        message: `Actor "${actor.id}" is not referenced by any Operation or Scenario`,
        path: `usecases.actors`,
      });
    }
  }

  // Unused operations
  for (const op of spec.usecases.operations) {
    if (!referencedOperations.has(op.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.operation",
        message: `Operation "${op.id}" is not referenced by any Scenario, View, SideEffect, or followUp`,
        path: `usecases.operations`,
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

  // Unused views
  for (const view of spec.ui.views) {
    if (!referencedViews.has(view.id)) {
      issues.push({
        severity: "warning",
        rule: "unused.view",
        message: `View "${view.id}" is not referenced by any Scenario`,
        path: `ui.views`,
      });
    }
  }

  return issues;
}
