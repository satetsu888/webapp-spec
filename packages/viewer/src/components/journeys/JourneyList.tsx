import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function JourneyList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Journeys</h2>
      <div className="space-y-6">
        {spec.actors.map((actor) => {
          const journeys = spec.journeys.filter((j) => j.actor === actor.id);
          if (journeys.length === 0) return null;
          return (
            <section key={actor.id}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Badge variant="green">{actor.id}</Badge>
                <span className="text-xs font-normal text-gray-400">
                  ({journeys.length})
                </span>
              </h3>
              <div className="space-y-2">
                {journeys.map((j) => (
                  <div
                    key={j.id}
                    className="rounded border border-gray-200 bg-white p-4"
                  >
                    <RefLink to={`/journeys/${j.id}`}>
                      <span className="font-medium">{j.id}</span>
                    </RefLink>
                    <p className="mt-1 text-sm text-gray-600">{j.goal}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {j.steps.length} steps
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
