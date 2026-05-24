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
      issues.push({ severity: "error", rule: "ref.entity", message: `Entity "${condition.entity}" は定義されていません`, path });
    } else {
      const entity = entityById(spec, condition.entity)!;
      if (!traitNames(entity).has(condition.trait)) {
        issues.push({ severity: "error", rule: "ref.trait", message: `Entity "${condition.entity}" に trait "${condition.trait}" は定義されていません`, path });
      }
    }
  } else if ("field" in condition && contextEntity) {
    if (!fieldNames(contextEntity).has(condition.field)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Entity "${contextEntity.id}" に field "${condition.field}" は定義されていません`, path });
    }
  }

  return issues;
}

export function checkReferences(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entities = entityIds(spec);
  const transitionIds = new Set(spec.domain.transitions.map((t) => t.id));
  const actorIds = new Set(spec.actors.map((a) => a.id));
  const usecaseIds = new Set(spec.usecases.map((u) => u.id));
  const relationIds = new Set(spec.domain.relations.map((r) => r.id));
  const componentIds = new Set(spec.ui.components.map((c) => c.id));
  const journeyIds = new Set(spec.journeys.map((j) => j.id));

  // Entity internal refs
  for (const entity of spec.domain.entities) {
    const fields = fieldNames(entity);
    const prefix = `domain.entities[${entity.id}]`;

    // ownership field
    if (entity.ownership.kind === "personal" && !fields.has(entity.ownership.ownerField)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" の ownership.ownerField "${entity.ownership.ownerField}" は fields に定義されていません`, path: `${prefix}.ownership` });
    }
    if (entity.ownership.kind === "group" && !fields.has(entity.ownership.groupField)) {
      issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" の ownership.groupField "${entity.ownership.groupField}" は fields に定義されていません`, path: `${prefix}.ownership` });
    }

    // state field
    for (let i = 0; i < entity.states.length; i++) {
      const state = entity.states[i];
      if (!fields.has(state.field)) {
        issues.push({ severity: "error", rule: "ref.field", message: `Entity "${entity.id}" の state "${state.name}" が参照する field "${state.field}" は定義されていません`, path: `${prefix}.states[${i}]` });
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
      issues.push({ severity: "error", rule: "ref.entity", message: `Relation "${rel.id}" の from "${rel.from}" は定義されていません`, path: `domain.relations[${i}]` });
    }
    if (!entities.has(rel.to)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Relation "${rel.id}" の to "${rel.to}" は定義されていません`, path: `domain.relations[${i}]` });
    }
  }

  // Transition refs
  for (let i = 0; i < spec.domain.transitions.length; i++) {
    const tr = spec.domain.transitions[i];
    for (let j = 0; j < tr.changes.length; j++) {
      const change = tr.changes[j];
      if (!entities.has(change.entity)) {
        issues.push({ severity: "error", rule: "ref.entity", message: `Transition "${tr.id}" が参照する entity "${change.entity}" は定義されていません`, path: `domain.transitions[${i}].changes[${j}]` });
      } else {
        const entity = entityById(spec, change.entity)!;
        const states = stateNames(entity);
        const pseudoSet = new Set<string>(PSEUDO_STATES);

        if (change.state.from === "_end") {
          issues.push({ severity: "error", rule: "transition.pseudo-state", message: `Transition "${tr.id}" の from に "_end" は使用できません（"_end" は to にのみ使用可能）`, path: `domain.transitions[${i}].changes[${j}].state.from` });
        } else if (!pseudoSet.has(change.state.from) && !states.has(change.state.from)) {
          issues.push({ severity: "error", rule: "ref.state", message: `Transition "${tr.id}" の from state "${change.state.from}" は Entity "${change.entity}" に定義されていません`, path: `domain.transitions[${i}].changes[${j}].state.from` });
        }

        if (change.state.to === "_start") {
          issues.push({ severity: "error", rule: "transition.pseudo-state", message: `Transition "${tr.id}" の to に "_start" は使用できません（"_start" は from にのみ使用可能）`, path: `domain.transitions[${i}].changes[${j}].state.to` });
        } else if (!pseudoSet.has(change.state.to) && !states.has(change.state.to)) {
          issues.push({ severity: "error", rule: "ref.state", message: `Transition "${tr.id}" の to state "${change.state.to}" は Entity "${change.entity}" に定義されていません`, path: `domain.transitions[${i}].changes[${j}].state.to` });
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
          issues.push({ severity: "error", rule: "ref.relation", message: `Spec "${s.id}" が参照する relation "${constraint.relation}" は定義されていません`, path: `specs[${i}].rules[${j}].constraint` });
        }
      }
      if ("entity" in constraint && "field" in constraint) {
        if (!entities.has(constraint.entity)) {
          issues.push({ severity: "error", rule: "ref.entity", message: `Spec "${s.id}" が参照する entity "${constraint.entity}" は定義されていません`, path: `specs[${i}].rules[${j}].constraint` });
        } else {
          const entity = entityById(spec, constraint.entity)!;
          if (!fieldNames(entity).has(constraint.field)) {
            issues.push({ severity: "error", rule: "ref.field", message: `Spec "${s.id}" が参照する field "${constraint.entity}.${constraint.field}" は定義されていません`, path: `specs[${i}].rules[${j}].constraint` });
          }
        }
      }
    }
  }

  // Actor refs from usecases
  for (let i = 0; i < spec.usecases.length; i++) {
    const uc = spec.usecases[i];
    if (!actorIds.has(uc.actor)) {
      issues.push({ severity: "error", rule: "ref.actor", message: `Usecase "${uc.id}" の actor "${uc.actor}" は定義されていません`, path: `usecases[${i}].actor` });
    }
    if (!entities.has(uc.target.entity)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Usecase "${uc.id}" の target entity "${uc.target.entity}" は定義されていません`, path: `usecases[${i}].target.entity` });
    } else if (uc.target.kind === "collection") {
      const entity = entityById(spec, uc.target.entity)!;
      const validNames = stateOrTraitNames(entity);
      for (const m of uc.target.matching) {
        if (!validNames.has(m)) {
          issues.push({ severity: "error", rule: "ref.state-trait", message: `Usecase "${uc.id}" の matching "${m}" は Entity "${uc.target.entity}" に定義されていません`, path: `usecases[${i}].target.matching` });
        }
      }
    }
    if (!transitionIds.has(uc.transition)) {
      issues.push({ severity: "error", rule: "ref.transition", message: `Usecase "${uc.id}" の transition "${uc.transition}" は定義されていません`, path: `usecases[${i}].transition` });
    }
    if (uc.followUps) {
      for (let j = 0; j < uc.followUps.length; j++) {
        if (!usecaseIds.has(uc.followUps[j].usecase)) {
          issues.push({ severity: "error", rule: "ref.usecase", message: `Usecase "${uc.id}" の followUp "${uc.followUps[j].usecase}" は定義されていません`, path: `usecases[${i}].followUps[${j}]` });
        }
      }
    }
  }

  // Reaction refs
  for (let i = 0; i < spec.reactions.length; i++) {
    const r = spec.reactions[i];
    if (!usecaseIds.has(r.trigger.usecase)) {
      issues.push({ severity: "error", rule: "ref.usecase", message: `Reaction の trigger.usecase "${r.trigger.usecase}" は定義されていません`, path: `reactions[${i}].trigger.usecase` });
    }
    if (!entities.has(r.trigger.entity)) {
      issues.push({ severity: "error", rule: "ref.entity", message: `Reaction の trigger.entity "${r.trigger.entity}" は定義されていません`, path: `reactions[${i}].trigger.entity` });
    }
  }

  // Journey refs
  for (let i = 0; i < spec.journeys.length; i++) {
    const j = spec.journeys[i];
    if (!actorIds.has(j.actor)) {
      issues.push({ severity: "error", rule: "ref.actor", message: `Journey "${j.id}" の actor "${j.actor}" は定義されていません`, path: `journeys[${i}].actor` });
    }
    for (let k = 0; k < j.steps.length; k++) {
      const step = j.steps[k];
      if (typeof step === "string") {
        if (!journeyIds.has(step)) {
          issues.push({ severity: "error", rule: "ref.journey", message: `Journey "${j.id}" が参照する journey "${step}" は定義されていません`, path: `journeys[${i}].steps[${k}]` });
        }
      } else {
        if (!usecaseIds.has(step.usecase)) {
          issues.push({ severity: "error", rule: "ref.usecase", message: `Journey "${j.id}" が参照する usecase "${step.usecase}" は定義されていません`, path: `journeys[${i}].steps[${k}]` });
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
        issues.push({ severity: "error", rule: "ref.entity", message: `Component "${comp.id}" の source entity "${src.entity}" は定義されていません`, path: `ui.components[${i}].sources[${j}]` });
      } else {
        const entity = entityById(spec, src.entity)!;
        const fields = fieldNames(entity);
        for (const f of src.fields) {
          if (!fields.has(f)) {
            issues.push({ severity: "error", rule: "ref.field", message: `Component "${comp.id}" の source field "${f}" は Entity "${src.entity}" に定義されていません`, path: `ui.components[${i}].sources[${j}].fields` });
          }
        }
        if (src.matching) {
          const validNames = stateOrTraitNames(entity);
          for (const m of src.matching) {
            if (!validNames.has(m)) {
              issues.push({ severity: "error", rule: "ref.state-trait", message: `Component "${comp.id}" の matching "${m}" は Entity "${src.entity}" に定義されていません`, path: `ui.components[${i}].sources[${j}].matching` });
            }
          }
        }
        if (src.sort) {
          for (const s of src.sort) {
            if (!fields.has(s.field)) {
              issues.push({ severity: "error", rule: "ref.field", message: `Component "${comp.id}" の sort field "${s.field}" は Entity "${src.entity}" に定義されていません`, path: `ui.components[${i}].sources[${j}].sort` });
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
        issues.push({ severity: "error", rule: "ref.component", message: `View "${view.id}" が参照する component "${view.components[j]}" は定義されていません`, path: `ui.views[${i}].components[${j}]` });
      }
    }
    for (let j = 0; j < view.actions.length; j++) {
      const action = view.actions[j];
      if (!usecaseIds.has(action.usecase)) {
        issues.push({ severity: "error", rule: "ref.usecase", message: `View "${view.id}" が参照する usecase "${action.usecase}" は定義されていません`, path: `ui.views[${i}].actions[${j}]` });
      }
    }
  }

  return issues;
}
