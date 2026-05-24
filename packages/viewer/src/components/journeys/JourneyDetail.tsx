import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function JourneyDetail({ id }: { id: string }) {
  const { journeyMap } = useSpec();
  const journey = journeyMap.get(id);
  if (!journey)
    return <p className="text-red-600">Journey "{id}" not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{journey.id}</h2>
        <Badge variant="green">{journey.actor}</Badge>
        <p className="mt-1 text-sm text-gray-600">{journey.goal}</p>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Steps</h3>
        <ol className="space-y-2">
          {journey.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded border border-gray-100 bg-white p-3 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                {i + 1}
              </span>
              {typeof step === "string" ? (
                <RefLink section="journeys" itemId={step}>
                  {step}
                </RefLink>
              ) : (
                <>
                  <RefLink section="usecases" itemId={step.usecase}>
                    {step.usecase}
                  </RefLink>
                  {step.description && (
                    <span className="text-gray-500">{step.description}</span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
