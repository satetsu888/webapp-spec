import type { WebAppSpec, Condition, Entity } from "@webapp-spec/types";
import { PSEUDO_STATES } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function entityIds(spec: WebAppSpec): Set<string> {
  return new Set(spec.domain.entities.map((e) => e.id));
}

function entityById(spec: WebAppSpec, id: string): Entity | undefined {
  return spec.domain.entities.find((e) => e.id === id);
}

function fieldNames(entity: Entity): Set<string> {
  return new Set(entity.fields.map((f) => f.name));
}

function stateNames(entity: Entity): Set<string> {
  return new Set(entity.states.map((s) => s.name));
}

function traitNames(entity: Entity): Set<string> {
  return new Set(entity.traits.map((t) => t.name));
}

function stateOrTraitNames(entity: Entity): Set<string> {
  return new Set([...stateNames(entity), ...traitNames(entity)]);
}

function checkConditionRefs(
  condition: Condition,
  entities: Set<string>,
  spec: WebAppSpec,
  path: string,
  contextEntity?: Entity,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if ("and" in condition) {
    for (let i = 0; i < condition.and.length; i++) {
      issues.push(...checkConditionRefs(condition.and[i], entities, spec, `${path}.and[${i}]`, contextEntity));
    }
  } else if ("or" in condition) {
    for (let i = 0; i < condition.or.length; i++) {
      issues.push(...checkConditionRefs(condition.or[i], entities, spec, `${path}.or[${i}]`, contextEntity));
    }
  } else if ("entity" in condition && "trait" in condition) {
    if (!entities.has(condition.entity)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Entity "${condition.entity}" is not defined`, path });
    } else {
      const entity = entityById(spec, condition.entity)!;
      if (!traitNames(entity).has(condition.trait)) {
        issues.push({ severity: "error", rule: "ref.trait", message: `Trait "${condition.trait}" is not defined on Entity "${condition.entity}"`, path });
      }
    }
  } else if ("field" in condition && contextEntity) {
    if (!fieldNames(contextEntity).has(condition.field)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Field "${condition.field}" is not defined on Entity "${contextEntity.id}"`, path });
    }
  }

  return issues;
}

export function checkReferences(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entities = entityIds(spec);
  const transitionIds = new Set(spec.domain.transitions.map((t) => t.id));
  const actorIds = new Set(spec.usecases.actors.map((a) => a.id));
  const operationIds = new Set(spec.usecases.operations.map((o) => o.id));
  const relationIds = new Set(spec.domain.relations.map((r) => r.id));
  const componentIds = new Set(spec.ui.components.map((c) => c.id));
  const scenarioIds = new Set(spec.scenarios.map((s) => s.id));
  const viewIds = new Set(spec.ui.views.map((v) => v.id));

  // Entity internal refs
  for (const entity of spec.domain.entities) {
    const fields = fieldNames(entity);
    const prefix = `domain.entities[${entity.id}]`;

    // ownership field
    if (entity.ownership.kind === "personal" && !fields.has(entity.ownership.ownerField)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" ownership.ownerField "${entity.ownership.ownerField}" is not defined in fields`, path: `${prefix}.ownership` });
    }
    if (entity.ownership.kind === "group" && !fields.has(entity.ownership.groupField)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" ownership.groupField "${entity.ownership.groupField}" is not defined in fields`, path: `${prefix}.ownership` });
    }
    if (entity.ownership.kind === "participants") {
      for (const pf of entity.ownership.participantFields) {
        if (!fields.has(pf)) {
          issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" ownership.participantFields "${pf}" is not defined in fields`, path: `${prefix}.ownership` });
        }
      }
    }

    // state field
    for (let i = 0; i < entity.states.length; i++) {
      const state = entity.states[i];
      if (!fields.has(state.field)) {
        issues.push({ severity: "error", rule: "ref.field", message: `State "${state.name}" on Entity "${entity.id}" references undefined field "${state.field}"`, path: `${prefix}.states[${i}]` });
      }
    }

    // trait derivedFrom
    for (let i = 0; i < entity.traits.length; i++) {
      issues.push(...checkConditionRefs(entity.traits[i].derivedFrom, entities, spec, `${prefix}.traits[${i}].derivedFrom`, entity));
    }
  }

  // Relation refs
  for (let i = 0; i < spec.domain.relations.length; i++) {
    const rel = spec.domain.relations[i];
    if (!entities.has(rel.from)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Relation "${rel.id}" references undefined entity "${rel.from}" in from`, path: `domain.relations[${i}]` });
    }
    if (!entities.has(rel.to)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Relation "${rel.id}" references undefined entity "${rel.to}" in to`, path: `domain.relations[${i}]` });
    }
  }

  // Transition refs
  for (let i = 0; i < spec.domain.transitions.length; i++) {
    const tr = spec.domain.transitions[i];
    for (let j = 0; j < tr.changes.length; j++) {
      const change = tr.changes[j];
      if (!entities.has(change.entity)) {
        issues.push({ severity: "error", rule: "ref.entity", message: `Transition "${tr.id}" references undefined entity "${change.entity}"`, path: `domain.transitions[${i}].changes[${j}]` });
      } else {
        const entity = entityById(spec, change.entity)!;
        const states = stateNames(entity);
        const pseudoSet = new Set<string>(PSEUDO_STATES);

        if (change.state.from === "_end") {
          issues.push({ severity: "error", rule: "transition.pseudo-state", message: `Transition "${tr.id}" cannot use "_end" as from state ("_end" is only valid as to)`, path: `domain.transitions[${i}].changes[${j}].state.from` });
        } else if (!pseudoSet.has(change.state.from) && !states.has(change.state.from)) {
          issues.push({ severity: "error", rule: "ref.state", message: `Transition "${tr.id}" from state "${change.state.from}" is not defined on Entity "${change.entity}"`, path: `domain.transitions[${i}].changes[${j}].state.from` });
        }

        if (change.state.to === "_start") {
          issues.push({ severity: "error", rule: "transition.pseudo-state", message: `Transition "${tr.id}" cannot use "_start" as to state ("_start" is only valid as from)`, path: `domain.transitions[${i}].changes[${j}].state.to` });
        } else if (!pseudoSet.has(change.state.to) && !states.has(change.state.to)) {
          issues.push({ severity: "error", rule: "ref.state", message: `Transition "${tr.id}" to state "${change.state.to}" is not defined on Entity "${change.entity}"`, path: `domain.transitions[${i}].changes[${j}].state.to` });
        }
      }
    }
    for (let j = 0; j < tr.conditions.length; j++) {
      issues.push(...checkConditionRefs(tr.conditions[j], entities, spec, `domain.transitions[${i}].conditions[${j}]`));
    }
  }

  // Spec refs
  for (let i = 0; i < spec.specs.length; i++) {
    const s = spec.specs[i];
    for (let j = 0; j < s.rules.length; j++) {
      const rule = s.rules[j];
      issues.push(...checkConditionRefs(rule.when, entities, spec, `specs[${i}].rules[${j}].when`));

      const constraint = rule.constraint;
      if ("relation" in constraint && !("entity" in constraint)) {
        if (!relationIds.has(constraint.relation)) {
          issues.push({ severity: "error", rule: "ref.relation", message: `Spec "${s.id}" references undefined relation "${constraint.relation}"`, path: `specs[${i}].rules[${j}].constraint` });
        }
      }
      if ("entity" in constraint && "field" in constraint) {
        if (!entities.has(constraint.entity)) {
          issues.push({ severity: "error", rule: "ref.entity", message: `Spec "${s.id}" references undefined entity "${constraint.entity}"`, path: `specs[${i}].rules[${j}].constraint` });
        } else {
          const entity = entityById(spec, constraint.entity)!;
          if (!fieldNames(entity).has(constraint.field)) {
            issues.push({ severity: "error", rule: "ref.field", message: `Spec "${s.id}" references undefined field "${constraint.entity}.${constraint.field}"`, path: `specs[${i}].rules[${j}].constraint` });
          }
        }
      }
    }
  }

  // Actor refs from operations
  for (let i = 0; i < spec.usecases.operations.length; i++) {
    const op = spec.usecases.operations[i];
    if (!actorIds.has(op.actor)) {
      issues.push({ severity: "error", rule: "ref.actor", message: `Operation "${op.id}" references undefined actor "${op.actor}"`, path: `usecases.operations[${i}].actor` });
    }
    if (!entities.has(op.target.entity)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Operation "${op.id}" references undefined target entity "${op.target.entity}"`, path: `usecases.operations[${i}].target.entity` });
    } else if (op.target.kind === "collection") {
      const entity = entityById(spec, op.target.entity)!;
      const validNames = stateOrTraitNames(entity);
      for (const m of op.target.matching) {
        if (!validNames.has(m)) {
          issues.push({ severity: "error", rule: "ref.state-trait", message: `Operation "${op.id}" matching "${m}" is not defined on Entity "${op.target.entity}"`, path: `usecases.operations[${i}].target.matching` });
        }
      }
    }
    if (op.transition && !transitionIds.has(op.transition)) {
      issues.push({ severity: "error", rule: "ref.transition", message: `Operation "${op.id}" references undefined transition "${op.transition}"`, path: `usecases.operations[${i}].transition` });
    }
    if (op.conditions) {
      const contextEntity = entityById(spec, op.target.entity);
      for (let j = 0; j < op.conditions.length; j++) {
        issues.push(...checkConditionRefs(op.conditions[j], entities, spec, `usecases.operations[${i}].conditions[${j}]`, contextEntity));
      }
    }
    if (op.followUps) {
      for (let j = 0; j < op.followUps.length; j++) {
        if (!operationIds.has(op.followUps[j].operation)) {
          issues.push({ severity: "error", rule: "ref.operation", message: `Operation "${op.id}" followUp references undefined operation "${op.followUps[j].operation}"`, path: `usecases.operations[${i}].followUps[${j}]` });
        }
      }
    }
  }

  // SideEffect refs
  for (let i = 0; i < spec.usecases.sideEffects.length; i++) {
    const se = spec.usecases.sideEffects[i];
    if (!operationIds.has(se.trigger.operation)) {
      issues.push({ severity: "error", rule: "ref.operation", message: `SideEffect trigger references undefined operation "${se.trigger.operation}"`, path: `usecases.sideEffects[${i}].trigger.operation` });
    }
    if (!entities.has(se.trigger.entity)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `SideEffect trigger references undefined entity "${se.trigger.entity}"`, path: `usecases.sideEffects[${i}].trigger.entity` });
    }
  }

  // Scenario refs
  for (let i = 0; i < spec.scenarios.length; i++) {
    const s = spec.scenarios[i];
    if (!actorIds.has(s.actor)) {
      issues.push({ severity: "error", rule: "ref.actor", message: `Scenario "${s.id}" references undefined actor "${s.actor}"`, path: `scenarios[${i}].actor` });
    }
    for (let k = 0; k < s.steps.length; k++) {
      const step = s.steps[k];
      if (typeof step === "string") {
        if (!scenarioIds.has(step)) {
          issues.push({ severity: "error", rule: "ref.scenario", message: `Scenario "${s.id}" references undefined scenario "${step}"`, path: `scenarios[${i}].steps[${k}]` });
        }
      } else if ("view" in step) {
        if (!viewIds.has(step.view)) {
          issues.push({ severity: "error", rule: "ref.view", message: `Scenario "${s.id}" references undefined view "${step.view}"`, path: `scenarios[${i}].steps[${k}]` });
        }
        if (step.action && !operationIds.has(step.action)) {
          issues.push({ severity: "error", rule: "ref.operation", message: `Scenario "${s.id}" references undefined operation "${step.action}"`, path: `scenarios[${i}].steps[${k}]` });
        }
      } else {
        if (!operationIds.has(step.operation)) {
          issues.push({ severity: "error", rule: "ref.operation", message: `Scenario "${s.id}" references undefined operation "${step.operation}"`, path: `scenarios[${i}].steps[${k}]` });
        }
        if (!actorIds.has(step.actor)) {
          issues.push({ severity: "error", rule: "ref.actor", message: `Scenario "${s.id}" background step references undefined actor "${step.actor}"`, path: `scenarios[${i}].steps[${k}]` });
        }
      }
    }
  }

  // Component refs
  for (let i = 0; i < spec.ui.components.length; i++) {
    const comp = spec.ui.components[i];
    for (let j = 0; j < comp.sources.length; j++) {
      const src = comp.sources[j];
      if (!entities.has(src.entity)) {
        issues.push({ severity: "error", rule: "ref.entity", message: `Component "${comp.id}" source references undefined entity "${src.entity}"`, path: `ui.components[${i}].sources[${j}]` });
      } else {
        const entity = entityById(spec, src.entity)!;
        const fields = fieldNames(entity);
        for (const f of src.fields) {
          if (!fields.has(f)) {
            issues.push({ severity: "error", rule: "ref.field", message: `Component "${comp.id}" source field "${f}" is not defined on Entity "${src.entity}"`, path: `ui.components[${i}].sources[${j}].fields` });
          }
        }
        if (src.matching) {
          const validNames = stateOrTraitNames(entity);
          for (const m of src.matching) {
            if (!validNames.has(m)) {
              issues.push({ severity: "error", rule: "ref.state-trait", message: `Component "${comp.id}" matching "${m}" is not defined on Entity "${src.entity}"`, path: `ui.components[${i}].sources[${j}].matching` });
            }
          }
        }
        if (src.sort) {
          for (const s of src.sort) {
            if (!fields.has(s.field)) {
              issues.push({ severity: "error", rule: "ref.field", message: `Component "${comp.id}" sort field "${s.field}" is not defined on Entity "${src.entity}"`, path: `ui.components[${i}].sources[${j}].sort` });
            }
          }
        }
      }
    }
  }

  // View refs
  for (let i = 0; i < spec.ui.views.length; i++) {
    const view = spec.ui.views[i];
    for (let j = 0; j < view.components.length; j++) {
      if (!componentIds.has(view.components[j])) {
        issues.push({ severity: "error", rule: "ref.component", message: `View "${view.id}" references undefined component "${view.components[j]}"`, path: `ui.views[${i}].components[${j}]` });
      }
    }
    for (let j = 0; j < view.actions.length; j++) {
      const action = view.actions[j];
      if (!operationIds.has(action.operation)) {
        issues.push({ severity: "error", rule: "ref.operation", message: `View "${view.id}" references undefined operation "${action.operation}"`, path: `ui.views[${i}].actions[${j}]` });
      }
    }
  }

  return issues;
}
