import { useState, useCallback } from "react";
import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";

type Props = {
  usecaseId: string;
  onSubmit: (input: Record<string, unknown>) => void;
};

export function InputForm({ usecaseId, onSubmit }: Props) {
  const { usecaseMap, transitionMap, spec } = useSpec();
  const { state } = useSimulation();
  const [values, setValues] = useState<Record<string, string>>({});

  const usecase = usecaseMap.get(usecaseId);
  if (!usecase) return null;

  const transition = usecase.transition ? transitionMap.get(usecase.transition) : undefined;
  const isCreation = transition?.changes.some(
    (ch) => ch.scope === "target" && ch.state.from === "_start",
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
      setValues({});
    },
    [values, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {Object.entries(usecase.input).map(([key, type]) => {
        const entityIdMatch = type.match(/^(\w+)\.id$/);

        const isTargetCreation =
          isCreation && entityIdMatch?.[1] === usecase.target.entity;
        if (entityIdMatch && !isTargetCreation) {
          const entityType = entityIdMatch[1];
          const instances = state.instances[entityType] ?? [];
          return (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {key}{" "}
                <span className="text-gray-400">({type})</span>
              </label>
              <select
                value={values[key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [key]: e.target.value }))
                }
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">-- select --</option>
                {instances.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.id} ({JSON.stringify(inst.fields)})
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {key} <span className="text-gray-400">({type})</span>
            </label>
            <input
              type={type === "date" || type === "datetime" ? "date" : "text"}
              value={values[key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: e.target.value }))
              }
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder={type}
            />
          </div>
        );
      })}
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
      >
        Execute
      </button>
    </form>
  );
}
