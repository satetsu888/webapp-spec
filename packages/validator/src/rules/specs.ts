import type { WebAppSpec, Condition } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function extractEntityTraitsFromCondition(condition: Condition): Array<{ entity: string; trait: string }> {
  if ("and" in condition) return condition.and.flatMap(extractEntityTraitsFromCondition);
  if ("or" in condition) return condition.or.flatMap(extractEntityTraitsFromCondition);
  if ("entity" in condition && "trait" in condition) return [{ entity: condition.entity, trait: condition.trait }];
  return [];
}

export function checkSpecs(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));

  for (let i = 0; i < spec.specs.length; i++) {
    const s = spec.specs[i];

    // Group rules by entity+trait-group to check coverage
    const traitsByEntity = new Map<string, Set<string>>();
    for (const rule of s.rules) {
      const refs = extractEntityTraitsFromCondition(rule.when);
      for (const ref of refs) {
        if (!traitsByEntity.has(ref.entity)) {
          traitsByEntity.set(ref.entity, new Set());
        }
        traitsByEntity.get(ref.entity)!.add(ref.trait);
      }
    }

    // Check if all traits of the same "family" are covered
    for (const [entityId, usedTraits] of traitsByEntity) {
      const entity = entityMap.get(entityId);
      if (!entity) continue;

      // Heuristic: if traits share a common prefix (e.g., "free-plan", "pro-plan", "enterprise-plan"),
      // check that all traits with that prefix are covered
      const allTraits = entity.traits.map((t) => t.name);
      const prefixes = new Map<string, string[]>();
      for (const t of allTraits) {
        const parts = t.split("-");
        if (parts.length >= 2) {
          const suffix = parts[parts.length - 1];
          const prefix = parts.slice(0, -1).join("-");
          if (!prefixes.has(prefix)) prefixes.set(prefix, []);
          prefixes.get(prefix)!.push(t);
        }
      }

      for (const [prefix, family] of prefixes) {
        if (family.length < 2) continue;
        const usedFromFamily = family.filter((t) => usedTraits.has(t));
        if (usedFromFamily.length > 0 && usedFromFamily.length < family.length) {
          const missing = family.filter((t) => !usedTraits.has(t));
          issues.push({
            severity: "warning",
            rule: "spec.incomplete-coverage",
            message: `Spec "${s.id}" does not cover traits ${missing.join(", ")} from Entity "${entityId}" trait family "${prefix}-*"`,
            path: `specs[${i}]`,
          });
        }
      }
    }
  }

  return issues;
}
