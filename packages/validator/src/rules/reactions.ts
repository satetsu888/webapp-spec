import type { WebAppSpec, Condition } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function extractFieldsFromCondition(condition: Condition): string[] {
  if ("and" in condition) return condition.and.flatMap(extractFieldsFromCondition);
  if ("or" in condition) return condition.or.flatMap(extractFieldsFromCondition);
  if ("field" in condition) return [condition.field];
  return [];
}

export function checkReactions(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const usecaseMap = new Map(spec.usecases.map((u) => [u.id, u]));
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));

  for (let i = 0; i < spec.reactions.length; i++) {
    const r = spec.reactions[i];

    // trigger entity matches usecase target entity
    const uc = usecaseMap.get(r.trigger.usecase);
    if (uc && uc.target.entity !== r.trigger.entity) {
      issues.push({
        severity: "error",
        rule: "reaction.entity",
        message: `Reaction の trigger.entity "${r.trigger.entity}" は Usecase "${r.trigger.usecase}" の target entity "${uc.target.entity}" と一致しません`,
        path: `reactions[${i}]`,
      });
    }

    // when conditions reference valid fields
    const entity = entityMap.get(r.trigger.entity);
    if (entity) {
      const fields = new Set(entity.fields.map((f) => f.name));
      for (let j = 0; j < r.when.length; j++) {
        const referencedFields = extractFieldsFromCondition(r.when[j]);
        for (const f of referencedFields) {
          if (!fields.has(f)) {
            issues.push({
              severity: "error",
              rule: "reaction.field",
              message: `Reaction の when 条件が参照する field "${f}" は Entity "${r.trigger.entity}" に定義されていません`,
              path: `reactions[${i}].when[${j}]`,
            });
          }
        }
      }
    }
  }

  return issues;
}
