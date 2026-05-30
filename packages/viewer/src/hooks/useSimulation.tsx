import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { WebAppSpec } from "@webapp-spec/types";
import type { SimState, ExecutionResult, EntityInstance } from "@/engine/types";
import { simReducer, initialSimState } from "@/engine/store";
import { executeOperation } from "@/engine/executor";

type SimContextValue = {
  state: SimState;
  selectActor: (actor: string | null) => void;
  selectView: (viewId: string | null) => void;
  bindActorInstance: (actorId: string, instanceId: string) => void;
  loadFixture: (spec: WebAppSpec, fixtureId: string) => void;
  execute: (
    spec: WebAppSpec,
    operationId: string,
    input: Record<string, unknown>,
  ) => ExecutionResult;
  reset: () => void;
};

const SimContext = createContext<SimContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simReducer, initialSimState);

  const selectActor = useCallback((actor: string | null) => {
    dispatch({ type: "SELECT_ACTOR", actor });
  }, []);

  const selectView = useCallback((viewId: string | null) => {
    dispatch({ type: "SELECT_VIEW", view: viewId });
  }, []);

  const bindActorInstance = useCallback(
    (actorId: string, instanceId: string) => {
      dispatch({ type: "BIND_ACTOR_INSTANCE", actor: actorId, instanceId });
    },
    [],
  );

  const loadFixture = useCallback((spec: WebAppSpec, fixtureId: string) => {
    const fixture = spec.fixtures?.find((f) => f.id === fixtureId);
    if (!fixture) return;

    const instances: Record<string, EntityInstance[]> = {};
    const nextId: Record<string, number> = {};

    for (const fi of fixture.instances) {
      const list = instances[fi.entity] ?? [];
      list.push({ id: fi.id, entityType: fi.entity, fields: fi.fields });
      instances[fi.entity] = list;

      const numMatch = fi.id.match(/-(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        nextId[fi.entity] = Math.max(nextId[fi.entity] ?? 0, num);
      }
    }

    dispatch({ type: "LOAD_FIXTURE", instances, nextId });
  }, []);

  const execute = useCallback(
    (
      spec: WebAppSpec,
      operationId: string,
      input: Record<string, unknown>,
    ): ExecutionResult => {
      const result = executeOperation(spec, state, operationId, input);
      if (result.success) {
        dispatch({ type: "APPLY_RESULT", result });
      }
      return result;
    },
    [state],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <SimContext.Provider value={{ state, selectActor, selectView, bindActorInstance, loadFixture, execute, reset }}>
      {children}
    </SimContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimContext);
  if (!ctx)
    throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
