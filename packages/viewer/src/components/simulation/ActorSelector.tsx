import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";
import { Badge } from "@/components/shared/Badge";

export function ActorSelector() {
  const { spec } = useSpec();
  const { state, selectActor } = useSimulation();

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Select Actor
      </h3>
      <div className="flex flex-wrap gap-2">
        {spec.actors.map((a) => (
          <button
            key={a.id}
            onClick={() =>
              selectActor(state.selectedActor === a.id ? null : a.id)
            }
            className={`rounded border px-3 py-1.5 text-sm transition-colors ${
              state.selectedActor === a.id
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {a.id}
            {"roles" in a.authState &&
              a.authState.roles.map((r) => (
                <Badge key={r} variant="purple">
                  {r}
                </Badge>
              ))}
          </button>
        ))}
      </div>
    </div>
  );
}
