import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkTransitions(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const relationPairs = new Set(
    spec.domain.relations.map((r) => `${r.from}:${r.to}`),
  );
  const allRelatedEntities = new Set(
    spec.domain.relations.flatMap((r) => [r.from, r.to]),
  );

  for (let i = 0; i < spec.domain.transitions.length; i++) {
    const tr = spec.domain.transitions[i];

    // scope: "related" requires a Relation between entities
    const targetEntities = tr.changes.filter((c) => c.scope === "target").map((c) => c.entity);
    for (const change of tr.changes) {
      if (change.scope === "related") {
        const hasRelation = targetEntities.some(
          (target) =>
            relationPairs.has(`${target}:${change.entity}`) ||
            relationPairs.has(`${change.entity}:${target}`),
        );
        if (!hasRelation) {
          issues.push({
            severity: "error",
            rule: "transition.entity-relation",
            message: `Transition "${tr.id}" uses scope "related" for entity "${change.entity}" but no Relation to target entity is defined`,
            path: `domain.transitions[${i}]`,
          });
        }
      }
    }

    // Duplicate transitions: same entity, same from→to
    for (let j = i + 1; j < spec.domain.transitions.length; j++) {
      const other = spec.domain.transitions[j];
      for (const c1 of tr.changes) {
        for (const c2 of other.changes) {
          if (c1.entity === c2.entity && c1.state.from === c2.state.from && c1.state.to === c2.state.to) {
            issues.push({
              severity: "warning",
              rule: "transition.duplicate",
              message: `Transitions "${tr.id}" and "${other.id}" define the same state change (${c1.entity}: ${c1.state.from} -> ${c1.state.to})`,
              path: `domain.transitions[${i}]`,
            });
          }
        }
      }
    }
  }

  // State reachability analysis per entity
  for (const entity of spec.domain.entities) {
    if (entity.states.length === 0) continue;

    const stateNameSet = new Set(entity.states.map((s) => s.name));
    const transitionsForEntity = spec.domain.transitions.flatMap((t) =>
      t.changes.filter((c) => c.entity === entity.id).map((c) => c.state),
    );

    const fromStates = new Set(transitionsForEntity.map((t) => t.from));
    const toStates = new Set(transitionsForEntity.map((t) => t.to));

    // States that are never a "to" target (potential initial states)
    const neverReachedByTransition = [...stateNameSet].filter((s) => !toStates.has(s));
    // States that are never a "from" source (potential terminal states)
    const neverLeftByTransition = [...stateNameSet].filter((s) => !fromStates.has(s));

    // Unreachable: state has no incoming transition and there are other states that do
    if (toStates.size > 0) {
      for (const s of neverReachedByTransition) {
        // If it's also never a from, it's completely disconnected
        if (!fromStates.has(s)) {
          issues.push({
            severity: "warning",
            rule: "transition.unreachable",
            message: `State "${s}" on Entity "${entity.id}" is unreachable (no transition arrives at or departs from it)`,
            path: `domain.entities[${entity.id}].states`,
          });
        }
      }
    }
  }

  return issues;
}
