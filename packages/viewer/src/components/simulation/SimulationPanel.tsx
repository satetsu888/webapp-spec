import { useState, useCallback } from "react";
import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";
import type { ExecutionResult } from "@/engine/types";
import { ActorSelector } from "./ActorSelector";
import { ActorInstanceSelector } from "./ActorInstanceSelector";
import { ViewSelector } from "./ViewSelector";
import { ActionSelector } from "./ActionSelector";
import { ExecutionResultView } from "./ExecutionResultView";
import { InstanceTable } from "./InstanceTable";

export function SimulationPanel() {
  const { spec, actorMap } = useSpec();
  const { execute, reset, loadFixture, state } = useSimulation();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  const fixtures = spec.fixtures ?? [];

  const handleExecute = useCallback(
    (input: Record<string, unknown>) => {
      if (!selectedAction) return;
      const result = execute(spec, selectedAction, input);
      setLastResult(result);
    },
    [spec, selectedAction, execute],
  );

  const handleReset = useCallback(() => {
    reset();
    setSelectedAction(null);
    setLastResult(null);
  }, [reset]);

  const selectedActorDef = state.selectedActor
    ? actorMap.get(state.selectedActor)
    : undefined;
  const actorReady =
    state.selectedActor &&
    (!selectedActorDef?.entity ||
      state.actorInstances[state.selectedActor] !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Simulation</h2>
        <button
          onClick={handleReset}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {fixtures.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Fixture
          </h3>
          <div className="flex flex-wrap gap-2">
            {fixtures.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  loadFixture(spec, f.id);
                  setSelectedAction(null);
                  setLastResult(null);
                }}
                className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                title={f.description}
              >
                {f.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <ActorSelector />

      {state.selectedActor && <ActorInstanceSelector />}

      {actorReady && <ViewSelector />}

      {state.selectedView && (
        <ActionSelector
          selectedAction={selectedAction}
          onSelect={setSelectedAction}
          onExecute={handleExecute}
        />
      )}

      {lastResult && <ExecutionResultView result={lastResult} />}

      <InstanceTable />

      {state.executionLog.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Execution Log
          </h3>
          <div className="space-y-2">
            {[...state.executionLog].reverse().map((r, i) => (
              <ExecutionResultView key={i} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
