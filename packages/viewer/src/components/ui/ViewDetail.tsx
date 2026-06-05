import { useMemo } from "react";
import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { FlowDiagram } from "@/components/shared/flow/FlowDiagram";
import { buildViewCompositionDiagram } from "./buildViewCompositionDiagram";

export function ViewDetail() {
  const { id } = useParams<{ id: string }>();
  const { viewMap, componentMap, operationMap } = useSpec();
  const view = viewMap.get(id!);
  if (!view) return <p className="text-red-600">View "{id}" not found</p>;

  const compositionDiagram = useMemo(
    () => buildViewCompositionDiagram(view, componentMap, operationMap),
    [view, componentMap, operationMap],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">{view.id}</h2>

      {compositionDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Data Flow
          </h3>
          <FlowDiagram data={compositionDiagram} />
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Components
        </h3>
        <div className="space-y-3">
          {view.components.map((cid) => {
            const comp = componentMap.get(cid);
            if (!comp)
              return (
                <div key={cid} className="text-sm text-red-600">
                  Component "{cid}" not found
                </div>
              );
            return (
              <div
                key={cid}
                className="rounded border border-gray-200 bg-white p-3"
              >
                <span className="font-medium text-sm">{comp.id}</span>
                <p className="text-xs text-gray-500">{comp.description}</p>
                {comp.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {comp.sources.map((src, i) => (
                      <span key={i} className="text-xs">
                        <RefLink to={`/domain/entities/${src.entity}`}>
                          {src.entity}
                        </RefLink>
                        {src.matching && (
                          <span className="text-gray-400">
                            [{src.matching.join(", ")}]
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {comp.outputs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {comp.outputs.map((o) => (
                      <Badge key={o.name} variant="blue">
                        {o.name}: {o.type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {view.actions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Actions</h3>
          <div className="space-y-2">
            {view.actions.map((a, i) => (
              <div
                key={i}
                className="rounded border border-gray-100 bg-white p-3 text-sm"
              >
                <RefLink to={`/operations/${a.operation}`}>
                  {a.operation}
                </RefLink>
                <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                  {Object.entries(a.inputFrom).map(([key, from]) => (
                    <div key={key}>
                      <span className="font-mono">{key}</span>
                      <span className="mx-1">&larr;</span>
                      <span className="font-mono">{from}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
