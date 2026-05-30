import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function ScenarioList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Scenarios</h2>
      <div className="space-y-6">
        {spec.usecases.actors.map((actor) => {
          const scenarios = spec.scenarios.filter((s) => s.actor === actor.id);
          if (scenarios.length === 0) return null;
          return (
            <section key={actor.id}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Badge variant="green">{actor.id}</Badge>
                <span className="text-xs font-normal text-gray-400">
                  ({scenarios.length})
                </span>
              </h3>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded border border-gray-200 bg-white p-4"
                  >
                    <RefLink to={`/scenarios/${s.id}`}>
                      <span className="font-medium">{s.id}</span>
                    </RefLink>
                    <p className="mt-1 text-sm text-gray-600">{s.goal}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {s.steps.length} steps
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
