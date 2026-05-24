import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";

type Props = {
  selectedUsecase: string | null;
  onSelect: (id: string | null) => void;
};

export function UsecaseSelector({ selectedUsecase, onSelect }: Props) {
  const { usecasesByActor } = useSpec();
  const { state } = useSimulation();

  if (!state.selectedActor) return null;

  const usecases = usecasesByActor(state.selectedActor);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Select Usecase
      </h3>
      <div className="space-y-1">
        {usecases.map((u) => (
          <button
            key={u.id}
            onClick={() =>
              onSelect(selectedUsecase === u.id ? null : u.id)
            }
            className={`block w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
              selectedUsecase === u.id
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="font-medium">{u.id}</span>
            <span className="ml-2 text-xs text-gray-500">
              {u.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
