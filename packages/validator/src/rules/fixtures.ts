import type { WebAppSpec, Entity } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function entityById(spec: WebAppSpec, id: string): Entity | undefined {
  return spec.domain.entities.find((e) => e.id === id);
}

function fieldNames(entity: Entity): Set<string> {
  return new Set(entity.fields.map((f) => f.name));
}

function stateValuesByField(entity: Entity): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const state of entity.states) {
    let values = map.get(state.field);
    if (!values) {
      values = new Set();
      map.set(state.field, values);
    }
    values.add(state.value);
  }
  return map;
}

function entityRefFields(entity: Entity): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of entity.fields) {
    const match = field.type.match(/^(.+)\.id$/);
    if (match) {
      map.set(field.name, match[1]);
    }
  }
  return map;
}

export function checkFixtures(spec: WebAppSpec): ValidationIssue[] {
  const fixtures = spec.fixtures;
  if (!fixtures || fixtures.length === 0) return [];

  const issues: ValidationIssue[] = [];
  const entityIds = new Set(spec.domain.entities.map((e) => e.id));

  for (let fi = 0; fi < fixtures.length; fi++) {
    const fixture = fixtures[fi];
    const prefix = `fixtures[${fi}]`;

    const allInstanceIds = new Set<string>();
    const seenInstanceIds = new Set<string>();

    for (const inst of fixture.instances) {
      allInstanceIds.add(inst.id);
    }

    for (let ii = 0; ii < fixture.instances.length; ii++) {
      const inst = fixture.instances[ii];
      const path = `${prefix}.instances[${ii}]`;

      if (seenInstanceIds.has(inst.id)) {
        issues.push({
          severity: "error",
          rule: "fixture.duplicate-instance-id",
          message: `Duplicate instance id "${inst.id}" in fixture "${fixture.id}"`,
          path,
        });
      }
      seenInstanceIds.add(inst.id);

      if (!entityIds.has(inst.entity)) {
        issues.push({
          severity: "error",
          rule: "fixture.entity-ref",
          message: `Fixture "${fixture.id}" instance "${inst.id}" references undefined entity "${inst.entity}"`,
          path,
        });
        continue;
      }

      const entity = entityById(spec, inst.entity)!;
      const fields = fieldNames(entity);
      const stateValues = stateValuesByField(entity);
      const refFields = entityRefFields(entity);

      for (const fieldName of Object.keys(inst.fields)) {
        if (!fields.has(fieldName)) {
          issues.push({
            severity: "error",
            rule: "fixture.unknown-field",
            message: `Fixture "${fixture.id}" instance "${inst.id}" has unknown field "${fieldName}" (not defined on Entity "${inst.entity}")`,
            path: `${path}.fields.${fieldName}`,
          });
          continue;
        }

        const value = inst.fields[fieldName];

        const validValues = stateValues.get(fieldName);
        if (validValues && typeof value === "string" && !validValues.has(value)) {
          issues.push({
            severity: "warning",
            rule: "fixture.invalid-state-value",
            message: `Fixture "${fixture.id}" instance "${inst.id}" field "${fieldName}" has value "${value}" which is not a defined state value for Entity "${inst.entity}"`,
            path: `${path}.fields.${fieldName}`,
          });
        }

        const refEntity = refFields.get(fieldName);
        if (refEntity && typeof value === "string" && !allInstanceIds.has(value)) {
          issues.push({
            severity: "warning",
            rule: "fixture.instance-ref",
            message: `Fixture "${fixture.id}" instance "${inst.id}" field "${fieldName}" references "${value}" which is not an instance in this fixture`,
            path: `${path}.fields.${fieldName}`,
          });
        }
      }
    }
  }

  return issues;
}
