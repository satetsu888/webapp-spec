import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";

type Props = {
  selectedAction: string | null;
  onSelect: (usecaseId: string | null) => void;
};

export function ActionSelector({ selectedAction, onSelect }: Props) {
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
      <div className="space-y-1">
        {view.actions.map((a) => {
          const uc = usecaseMap.get(a.usecase);
          return (
            <button
              key={a.usecase}
              onClick={() =>
                onSelect(selectedAction === a.usecase ? null : a.usecase)
              }
              className={`block w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                selectedAction === a.usecase
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium">{a.usecase}</span>
              {uc && (
                <span className="ml-2 text-xs text-gray-500">
                  {uc.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
