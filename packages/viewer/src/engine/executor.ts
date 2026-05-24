import type { WebAppSpec, StateChange } from "@webapp-spec/types";
import type {
  SimState,
  EntityInstance,
  Mutation,
  FiredReaction,
  ExecutionResult,
} from "./types";

export function executeUsecase(
  spec: WebAppSpec,
  state: SimState,
  usecaseId: string,
  input: Record<string, unknown>,
): ExecutionResult {
  const usecase = spec.usecases.find((u) => u.id === usecaseId);
  if (!usecase) {
    return {
      success: false,
      usecaseId,
      mutations: [],
      firedReactions: [],
      error: `Usecase "${usecaseId}" not found`,
    };
  }

  const transition = spec.domain.transitions.find(
    (t) => t.id === usecase.transition,
  );
  if (!transition) {
    return {
      success: false,
      usecaseId,
      mutations: [],
      firedReactions: [],
      error: `Transition "${usecase.transition}" not found`,
    };
  }

  const mutations: Mutation[] = [];
  const targetChange = transition.changes.find((ch) => ch.scope === "target");

  if (targetChange && targetChange.state.from === "_start") {
    const result = handleCreation(spec, state, targetChange, transition, input);
    if (!result.success) return { ...result, usecaseId };
    mutations.push(...result.mutations);
  } else {
    const targetEntityType = usecase.target.entity;
    const targetInstanceId = findTargetInstanceId(
      input,
      usecase.input,
      targetEntityType,
    );

    if (!targetInstanceId && targetChange) {
      return {
        success: false,
        usecaseId,
        mutations: [],
        firedReactions: [],
        error: `No target instance selected for ${targetEntityType}`,
      };
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
            usecaseId,
            mutations: [],
            firedReactions: [],
            error: result.error,
          };
      } else {
        handleRelatedChange(spec, state, change, targetEntityType, mutations);
      }
    }
  }

  const firedReactions = collectReactions(spec, usecaseId);

  return { success: true, usecaseId, mutations, firedReactions };
}

function handleCreation(
  spec: WebAppSpec,
  state: SimState,
  targetChange: StateChange,
  transition: { changes: StateChange[] },
  input: Record<string, unknown>,
): Omit<ExecutionResult, "usecaseId"> {
  const entity = spec.domain.entities.find(
    (e) => e.id === targetChange.entity,
  );
  if (!entity) {
    return {
      success: false,
      mutations: [],
      firedReactions: [],
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

  return { success: true, mutations, firedReactions: [] };
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

function collectReactions(
  spec: WebAppSpec,
  usecaseId: string,
): FiredReaction[] {
  return spec.reactions
    .filter((r) => r.trigger.usecase === usecaseId)
    .map((r) => ({
      description: r.description,
      notify: r.notify,
    }));
}
