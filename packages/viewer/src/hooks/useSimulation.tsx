import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { WebAppSpec } from "@webapp-spec/types";
import type { SimState, ExecutionResult } from "@/engine/types";
import { simReducer, initialSimState } from "@/engine/store";
import { executeUsecase } from "@/engine/executor";

type SimContextValue = {
  state: SimState;
  selectActor: (actor: string | null) => void;
  execute: (
    spec: WebAppSpec,
    usecaseId: string,
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

  const execute = useCallback(
    (
      spec: WebAppSpec,
      usecaseId: string,
      input: Record<string, unknown>,
    ): ExecutionResult => {
      const result = executeUsecase(spec, state, usecaseId, input);
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
    <SimContext.Provider value={{ state, selectActor, execute, reset }}>
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
