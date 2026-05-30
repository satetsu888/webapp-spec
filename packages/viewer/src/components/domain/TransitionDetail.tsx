import { useMemo } from "react";
import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { StateArrow } from "@/components/shared/StateArrow";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildTransitionDiagram } from "./buildTransitionDiagram";

export function TransitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { transitionMap, sideEffectsByOperation, spec } = useSpec();
  const transition = transitionMap.get(id!);
  if (!transition)
    return <p className="text-red-600">Transition "{id}" not found</p>;

  const operations = spec.usecases.operations.filter((o) => o.transition === id);

  const diagram = useMemo(
    () => buildTransitionDiagram(transition),
    [transition],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{transition.id}</h2>
        <p className="text-sm text-gray-600">{transition.description}</p>
      </div>

      {diagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            State Diagram
          </h3>
          <MermaidDiagram chart={diagram} />
        </section>
      )}

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
              <StateArrow entity={ch.entity} from={ch.state.from} to={ch.state.to} />
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

      {operations.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used by Operations
          </h3>
          <div className="space-y-1">
            {operations.map((o) => (
              <div key={o.id} className="text-sm">
                <RefLink to={`/operations/${o.id}`}>
                  {o.id}
                </RefLink>
                <span className="ml-2 text-gray-500">({o.actor})</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
