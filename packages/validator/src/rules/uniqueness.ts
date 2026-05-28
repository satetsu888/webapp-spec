import type { WebAppSpec } from "@webapp-spec/types";
import { PSEUDO_STATES } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function duplicates(items: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const item of items) {
    if (seen.has(item)) dupes.push(item);
    else seen.add(item);
  }
  return dupes;
}

export function checkUniqueness(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const topLevelChecks: Array<{ ids: string[]; path: string; label: string }> = [
    { ids: spec.domain.entities.map((e) => e.id), path: "domain.entities", label: "Entity" },
    { ids: spec.domain.relations.map((r) => r.id), path: "domain.relations", label: "Relation" },
    { ids: spec.domain.transitions.map((t) => t.id), path: "domain.transitions", label: "Transition" },
    { ids: spec.specs.map((s) => s.id), path: "specs", label: "Spec" },
    { ids: spec.actors.map((a) => a.id), path: "actors", label: "Actor" },
    { ids: spec.usecases.map((u) => u.id), path: "usecases", label: "Usecase" },
    { ids: spec.scenarios.map((s) => s.id), path: "scenarios", label: "Scenario" },
    { ids: spec.ui.components.map((c) => c.id), path: "ui.components", label: "Component" },
    { ids: spec.ui.views.map((v) => v.id), path: "ui.views", label: "View" },
    { ids: (spec.fixtures ?? []).map((f) => f.id), path: "fixtures", label: "Fixture" },
  ];

  for (const { ids, path, label } of topLevelChecks) {
    for (const dup of duplicates(ids)) {
      issues.push({
        severity: "error",
        rule: `unique.${label.toLowerCase()}-id`,
        message: `Duplicate ${label} id "${dup}"`,
        path,
      });
    }
  }

  for (const entity of spec.domain.entities) {
    const prefix = `domain.entities[${entity.id}]`;
    for (const dup of duplicates(entity.fields.map((f) => f.name))) {
      issues.push({ severity: "error", rule: "unique.field-name", message: `Duplicate field name "${dup}" in Entity "${entity.id}"`, path: `${prefix}.fields` });
    }
    for (const dup of duplicates(entity.states.map((s) => s.name))) {
      issues.push({ severity: "error", rule: "unique.state-name", message: `Duplicate state name "${dup}" in Entity "${entity.id}"`, path: `${prefix}.states` });
    }
    for (const dup of duplicates(entity.traits.map((t) => t.name))) {
      issues.push({ severity: "error", rule: "unique.trait-name", message: `Duplicate trait name "${dup}" in Entity "${entity.id}"`, path: `${prefix}.traits` });
    }

    const pseudoSet = new Set<string>(PSEUDO_STATES);
    for (const state of entity.states) {
      if (pseudoSet.has(state.name)) {
        issues.push({
          severity: "error",
          rule: "unique.reserved-state-name",
          message: `State name "${state.name}" in Entity "${entity.id}" is a reserved pseudo-state`,
          path: `${prefix}.states`,
        });
      }
    }

    const stateNames = new Set(entity.states.map((s) => s.name));
    for (const trait of entity.traits) {
      if (stateNames.has(trait.name)) {
        issues.push({
          severity: "error",
          rule: "unique.state-trait-collision",
          message: `State and trait name "${trait.name}" collide in Entity "${entity.id}"`,
          path: `${prefix}.traits`,
        });
      }
    }
  }

  return issues;
}
