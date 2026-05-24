import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { StateArrow } from "@/components/shared/StateArrow";
import { Badge } from "@/components/shared/Badge";

export function TransitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { transitionMap, reactionsByUsecase, spec } = useSpec();
  const transition = transitionMap.get(id!);
  if (!transition)
    return <p className="text-red-600">Transition "{id}" not found</p>;

  const usecases = spec.usecases.filter((u) => u.transition === id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{transition.id}</h2>
        <p className="text-sm text-gray-600">{transition.description}</p>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          State Changes
        </h3>
        <div className="space-y-2">
          {transition.changes.map((ch, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded border border-gray-100 bg-white p-3 text-sm"
            >
              <RefLink to={`/entities/${ch.entity}`}>
                {ch.entity}
              </RefLink>
              <StateArrow from={ch.state.from} to={ch.state.to} />
              <Badge variant={ch.scope === "target" ? "blue" : "yellow"}>
                {ch.scope}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {transition.conditions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Conditions
          </h3>
          <pre className="rounded bg-gray-50 p-3 text-xs">
            {JSON.stringify(transition.conditions, null, 2)}
          </pre>
        </section>
      )}

      {usecases.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used by Usecases
          </h3>
          <div className="space-y-1">
            {usecases.map((u) => (
              <div key={u.id} className="text-sm">
                <RefLink to={`/usecases/${u.id}`}>
                  {u.id}
                </RefLink>
                <span className="ml-2 text-gray-500">({u.actor})</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
