import type { SimState, SimAction } from "./types";

export const initialSimState: SimState = {
  instances: {},
  nextId: {},
  selectedActor: null,
  executionLog: [],
};

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SELECT_ACTOR":
      return { ...state, selectedActor: action.actor };

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

    case "RESET":
      return initialSimState;
  }
}
