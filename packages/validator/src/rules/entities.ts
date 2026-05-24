import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkEntities(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const entity of spec.domain.entities) {
    if (entity.states.length === 0) {
      issues.push({
        severity: "error",
        rule: "entity.no-states",
        message: `Entity "${entity.id}" has no states defined`,
        path: `domain.entities`,
      });
    }
  }

  return issues;
}
