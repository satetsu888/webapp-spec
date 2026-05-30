import type { WebAppSpec, Condition } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function extractFieldsFromCondition(condition: Condition): string[] {
  if ("and" in condition) return condition.and.flatMap(extractFieldsFromCondition);
  if ("or" in condition) return condition.or.flatMap(extractFieldsFromCondition);
  if ("field" in condition) return [condition.field];
  return [];
}

export function checkSideEffects(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const operationMap = new Map(spec.usecases.operations.map((o) => [o.id, o]));
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));

  for (let i = 0; i < spec.usecases.sideEffects.length; i++) {
    const se = spec.usecases.sideEffects[i];

    // trigger entity matches operation target entity
    const op = operationMap.get(se.trigger.operation);
    if (op && op.target.entity !== se.trigger.entity) {
      issues.push({
        severity: "error",
        rule: "sideeffect.entity",
        message: `SideEffect trigger.entity "${se.trigger.entity}" does not match operation "${se.trigger.operation}" target entity "${op.target.entity}"`,
        path: `usecases.sideEffects[${i}]`,
      });
    }

    // when conditions reference valid fields
    const entity = entityMap.get(se.trigger.entity);
    if (entity) {
      const fields = new Set(entity.fields.map((f) => f.name));
      for (let j = 0; j < se.when.length; j++) {
        const referencedFields = extractFieldsFromCondition(se.when[j]);
        for (const f of referencedFields) {
          if (!fields.has(f)) {
            issues.push({
              severity: "error",
              rule: "sideeffect.field",
              message: `SideEffect when condition references undefined field "${f}" on Entity "${se.trigger.entity}"`,
              path: `usecases.sideEffects[${i}].when[${j}]`,
            });
          }
        }
      }
    }
  }

  return issues;
}
