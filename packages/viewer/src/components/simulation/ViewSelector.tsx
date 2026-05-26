import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";

export function ViewSelector() {
  const { viewsForActor } = useSpec();
  const { state, selectView } = useSimulation();

  if (!state.selectedActor) return null;

  const views = viewsForActor(state.selectedActor);

  if (views.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No views for this actor.
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Select View</h3>
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() =>
              selectView(state.selectedView === v.id ? null : v.id)
            }
            className={`rounded border px-3 py-1.5 text-sm transition-colors ${
              state.selectedView === v.id
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {v.id}
          </button>
        ))}
      </div>
    </div>
  );
}
