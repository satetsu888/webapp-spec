import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function JourneyList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Journeys</h2>
      <div className="space-y-2">
        {spec.journeys.map((j) => (
          <div
            key={j.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <RefLink to={`/journeys/${j.id}`}>
                <span className="font-medium">{j.id}</span>
              </RefLink>
              <Badge variant="green">{j.actor}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">{j.goal}</p>
            <div className="mt-1 text-xs text-gray-500">
              {j.steps.length} steps
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
