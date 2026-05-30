import type { WebAppSpec, StateChange, Operation } from "@webapp-spec/types";
import type {
  SimState,
  EntityInstance,
  Mutation,
  FiredSideEffect,
  ExecutionResult,
} from "./types";

export function executeOperation(
  spec: WebAppSpec,
  state: SimState,
  operationId: string,
  input: Record<string, unknown>,
): ExecutionResult {
  const operation = spec.usecases.operations.find((u) => u.id === operationId);
  if (!operation) {
    return {
      success: false,
      operationId,
      mutations: [],
      firedSideEffects: [],
      error: `Operation "${operationId}" not found`,
    };
  }

  const resolved = resolveActorIdInputs(spec, state, operation, input);
  if ("error" in resolved) {
    return {
      success: false,
      operationId,
      mutations: [],
      firedSideEffects: [],
      error: resolved.error,
    };
  }
  const resolvedInput = resolved.input;
  const resolvedSchema = resolved.schema;

  if (!operation.transition) {
    const firedSideEffects = collectSideEffects(spec, operationId);
    return { success: true, operationId, mutations: [], firedSideEffects };
  }

  const transition = spec.domain.transitions.find(
    (t) => t.id === operation.transition,
  );
  if (!transition) {
    return {
      success: false,
      operationId,
      mutations: [],
      firedSideEffects: [],
      error: `Transition "${operation.transition}" not found`,
    };
  }

  const mutations: Mutation[] = [];
  const targetChange = transition.changes.find((ch) => ch.scope === "target");

  if (targetChange && targetChange.state.from === "_start") {
    const result = handleCreation(spec, state, targetChange, transition, resolvedInput);
    if (!result.success) return { ...result, operationId };
    mutations.push(...result.mutations);
  } else {
    const targetEntityType = operation.target.entity;
    const targetInstanceId = findTargetInstanceId(
      resolvedInput,
      resolvedSchema,
      targetEntityType,
    );

    if (!targetInstanceId && targetChange) {
      return {
        success: false,
        operationId,
        mutations: [],
        firedSideEffects: [],
        error: `No target instance selected for ${targetEntityType}`,
      };
    }

    if (targetInstanceId && operation.target.scopeByActor) {
      const scopeError = checkActorScope(
        spec,
        state,
        operation,
        targetEntityType,
        targetInstanceId,
      );
      if (scopeError) {
        return {
          success: false,
          operationId,
          mutations: [],
          firedSideEffects: [],
          error: scopeError,
        };
      }
    }

    for (const change of transition.changes) {
      if (change.scope === "target") {
        const result = handleTargetChange(
          state,
          change,
          targetInstanceId!,
          mutations,
        );
        if (result.error)
          return {
            success: false,
            operationId,
            mutations: [],
            firedSideEffects: [],
            error: result.error,
          };
      } else {
        handleRelatedChange(spec, state, change, targetEntityType, mutations);
      }
    }
  }

  const firedSideEffects = collectSideEffects(spec, operationId);

  return { success: true, operationId, mutations, firedSideEffects };
}

function handleCreation(
  spec: WebAppSpec,
  state: SimState,
  targetChange: StateChange,
  transition: { changes: StateChange[] },
  input: Record<string, unknown>,
): Omit<ExecutionResult, "operationId"> {
  const entity = spec.domain.entities.find(
    (e) => e.id === targetChange.entity,
  );
  if (!entity) {
    return {
      success: false,
      mutations: [],
      firedSideEffects: [],
      error: `Entity "${targetChange.entity}" not found`,
    };
  }

  const nextNum = (state.nextId[entity.id] ?? 0) + 1;
  const instanceId = `${entity.id}-${nextNum}`;

  const fields: Record<string, unknown> = {};
  for (const f of entity.fields) {
    if (f.name in input) {
      fields[f.name] = input[f.name];
    }
  }

  const stateField = entity.states.find(
    (s) => s.value === targetChange.state.to,
  );
  if (stateField) {
    fields[stateField.field] = stateField.value;
  }

  const instance: EntityInstance = {
    id: instanceId,
    entityType: entity.id,
    fields,
  };

  const mutations: Mutation[] = [
    { kind: "created", entity: entity.id, instance },
  ];

  for (const change of transition.changes) {
    if (change.scope === "related") {
      handleRelatedChange(spec, state, change, entity.id, mutations);
    }
  }

  return { success: true, mutations, firedSideEffects: [] };
}

function handleTargetChange(
  state: SimState,
  change: StateChange,
  instanceId: string,
  mutations: Mutation[],
): { error?: string } {
  const instances = state.instances[change.entity] ?? [];
  const instance = instances.find((inst) => inst.id === instanceId);
  if (!instance) {
    return { error: `Instance "${instanceId}" not found` };
  }

  const entity_states = change.entity;
  const currentStateValue = findCurrentStateValue(instance, change);

  if (change.state.from !== "_start" && currentStateValue !== change.state.from) {
    return {
      error: `${change.entity} "${instanceId}" is not in state "${change.state.from}" (current: "${currentStateValue ?? "unknown"}")`,
    };
  }

  if (change.state.to === "_end") {
    mutations.push({ kind: "deleted", entity: change.entity, instanceId });
  } else {
    const stateField = getStateField(instance, change);
    if (stateField) {
      mutations.push({
        kind: "stateChanged",
        entity: change.entity,
        instanceId,
        field: stateField,
        from: change.state.from,
        to: change.state.to,
      });
    }
  }

  return {};
}

function handleRelatedChange(
  spec: WebAppSpec,
  state: SimState,
  change: StateChange,
  targetEntityType: string,
  mutations: Mutation[],
) {
  const relatedInstances = state.instances[change.entity] ?? [];
  for (const inst of relatedInstances) {
    const currentValue = findCurrentStateValue(inst, change);
    if (currentValue === change.state.from) {
      if (change.state.to === "_end") {
        mutations.push({
          kind: "deleted",
          entity: change.entity,
          instanceId: inst.id,
        });
      } else {
        const stateField = getStateField(inst, change);
        if (stateField) {
          mutations.push({
            kind: "stateChanged",
            entity: change.entity,
            instanceId: inst.id,
            field: stateField,
            from: change.state.from,
            to: change.state.to,
          });
        }
      }
    }
  }
}

function findTargetInstanceId(
  input: Record<string, unknown>,
  schema: Record<string, string>,
  targetEntity: string,
): string | null {
  for (const [key, type] of Object.entries(schema)) {
    if (type === `${targetEntity}.id` && input[key]) {
      return input[key] as string;
    }
  }
  return null;
}

function findCurrentStateValue(
  instance: EntityInstance,
  change: StateChange,
): string | null {
  for (const [, value] of Object.entries(instance.fields)) {
    if (value === change.state.from) return change.state.from;
  }
  return null;
}

function getStateField(
  instance: EntityInstance,
  change: StateChange,
): string | null {
  for (const [key, value] of Object.entries(instance.fields)) {
    if (value === change.state.from) return key;
  }
  for (const key of Object.keys(instance.fields)) {
    if (key === "status") return key;
  }
  return null;
}

function checkActorScope(
  spec: WebAppSpec,
  state: SimState,
  operation: Operation,
  targetEntityType: string,
  targetInstanceId: string,
): string | null {
  const scopeFields = operation.target.scopeByActor;
  if (!scopeFields) return null;

  const actor = spec.usecases.actors.find((a) => a.id === operation.actor);
  if (!actor?.entity) {
    return `Actor "${operation.actor}" has no entity binding but operation has scopeByActor`;
  }

  const actorInstanceId = state.actorInstances[actor.id];
  if (!actorInstanceId) {
    return `No instance bound for actor "${actor.id}"`;
  }

  const instances = state.instances[targetEntityType] ?? [];
  const instance = instances.find((inst) => inst.id === targetInstanceId);
  if (!instance) return null;

  const hasAccess = scopeFields.some(
    (field) => instance.fields[field] === actorInstanceId,
  );
  if (!hasAccess) {
    return `Actor "${actor.id}" does not have access to ${targetEntityType} "${targetInstanceId}" (checked fields: ${scopeFields.join(", ")})`;
  }

  return null;
}

function resolveActorIdInputs(
  spec: WebAppSpec,
  state: SimState,
  operation: Operation,
  input: Record<string, unknown>,
):
  | { input: Record<string, unknown>; schema: Record<string, string> }
  | { error: string } {
  const hasActorIdField = Object.values(operation.input).some(
    (t) => t === "actor.id",
  );
  if (!hasActorIdField) {
    return { input, schema: operation.input };
  }

  const actor = spec.usecases.actors.find((a) => a.id === operation.actor);
  if (!actor?.entity) {
    return {
      error: `Actor "${operation.actor}" has no entity binding but operation uses actor.id`,
    };
  }

  const instanceId = state.actorInstances[actor.id];
  if (!instanceId) {
    return {
      error: `No instance bound for actor "${actor.id}"`,
    };
  }

  const resolvedInput = { ...input };
  const resolvedSchema: Record<string, string> = {};
  for (const [key, type] of Object.entries(operation.input)) {
    if (type === "actor.id") {
      resolvedInput[key] = instanceId;
      resolvedSchema[key] = `${actor.entity}.id`;
    } else {
      resolvedSchema[key] = type;
    }
  }

  return { input: resolvedInput, schema: resolvedSchema };
}

function collectSideEffects(
  spec: WebAppSpec,
  operationId: string,
): FiredSideEffect[] {
  return spec.usecases.sideEffects
    .filter((se) => se.trigger.operation === operationId)
    .map((se) => ({
      description: se.description,
      notify: se.notify,
    }));
}
