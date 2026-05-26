import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";
import { InputForm } from "./InputForm";

type Props = {
  selectedAction: string | null;
  onSelect: (usecaseId: string | null) => void;
  onExecute: (input: Record<string, unknown>) => void;
};

export function ActionSelector({ selectedAction, onSelect, onExecute }: Props) {
  const { viewMap, usecaseMap } = useSpec();
  const { state } = useSimulation();

  if (!state.selectedView) return null;

  const view = viewMap.get(state.selectedView);
  if (!view) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Actions on {view.id}
      </h3>
      <div className="space-y-2">
        {view.actions.map((a) => {
          const uc = usecaseMap.get(a.usecase);
          const isSelected = selectedAction === a.usecase;
          return (
            <div
              key={a.usecase}
              className={`rounded-lg border transition-colors ${
                isSelected
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <button
                onClick={() => onSelect(isSelected ? null : a.usecase)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm"
              >
                <span
                  className={`font-medium ${isSelected ? "text-blue-800" : "text-gray-700"}`}
                >
                  {a.usecase}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${isSelected ? "rotate-180 text-blue-500" : "text-gray-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isSelected && (
                <div className="border-t border-blue-200 px-4 py-3">
                  {uc?.description && (
                    <p className="mb-3 text-xs text-gray-600">
                      {uc.description}
                    </p>
                  )}
                  <InputForm usecaseId={a.usecase} onSubmit={onExecute} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
