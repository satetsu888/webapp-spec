import type { SimState, SimAction } from "./types";

export const initialSimState: SimState = {
  instances: {},
  nextId: {},
  selectedActor: null,
  selectedView: null,
  actorInstances: {},
  executionLog: [],
  fixtureState: null,
};

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SELECT_ACTOR":
      return { ...state, selectedActor: action.actor, selectedView: null };

    case "SELECT_VIEW":
      return { ...state, selectedView: action.view };

    case "BIND_ACTOR_INSTANCE":
      return {
        ...state,
        actorInstances: {
          ...state.actorInstances,
          [action.actor]: action.instanceId,
        },
      };

    case "APPLY_RESULT": {
      const { result } = action;
      const instances = { ...state.instances };
      const nextId = { ...state.nextId };

      for (const m of result.mutations) {
        switch (m.kind) {
          case "created": {
            const list = [...(instances[m.entity] ?? [])];
            list.push(m.instance);
            instances[m.entity] = list;
            nextId[m.entity] = (nextId[m.entity] ?? 0) + 1;
            break;
          }
          case "stateChanged": {
            const list = (instances[m.entity] ?? []).map((inst) =>
              inst.id === m.instanceId
                ? {
                    ...inst,
                    fields: { ...inst.fields, [m.field]: m.to },
                  }
                : inst,
            );
            instances[m.entity] = list;
            break;
          }
          case "deleted": {
            instances[m.entity] = (instances[m.entity] ?? []).filter(
              (inst) => inst.id !== m.instanceId,
            );
            break;
          }
        }
      }

      return {
        ...state,
        instances,
        nextId,
        executionLog: [...state.executionLog, result],
      };
    }

    case "LOAD_FIXTURE": {
      const snapshot = { instances: action.instances, nextId: action.nextId };
      return {
        ...initialSimState,
        instances: action.instances,
        nextId: action.nextId,
        fixtureState: snapshot,
      };
    }

    case "RESET":
      if (state.fixtureState) {
        return {
          ...initialSimState,
          instances: state.fixtureState.instances,
          nextId: state.fixtureState.nextId,
          fixtureState: state.fixtureState,
        };
      }
      return initialSimState;
  }
}
