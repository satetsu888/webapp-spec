import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function OperationList() {
  const { spec, operationsByActor } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Operations</h2>
      <div className="space-y-6">
        {spec.usecases.actors.map((actor) => {
          const operations = operationsByActor(actor.id);
          if (operations.length === 0) return null;
          return (
            <section key={actor.id}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Badge variant="green">{actor.id}</Badge>
                <span className="text-xs font-normal text-gray-400">
                  ({operations.length})
                </span>
              </h3>
              <div className="space-y-2">
                {operations.map((o) => (
                  <div
                    key={o.id}
                    className="rounded border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-2">
                      <RefLink to={`/operations/${o.id}`}>
                        <span className="font-medium">{o.id}</span>
                      </RefLink>
                      <RefLink
                        to={`/entities/${o.target.entity}`}
                        className="text-sm"
                      >
                        {o.target.entity}
                      </RefLink>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {o.description}
                    </p>
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
