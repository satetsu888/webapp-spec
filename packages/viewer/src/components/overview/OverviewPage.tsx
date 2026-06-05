import { useMemo } from "react";
import { useSpec } from "@/hooks/useSpec";
import { FlowDiagram } from "@/components/shared/flow/FlowDiagram";
import { buildAppMapDiagram } from "@/components/overview/buildAppMapDiagram";
import { buildErDiagram } from "@/components/domain/buildErDiagram";
export function OverviewPage() {
  const { spec } = useSpec();
  const { components, views } = spec.ui;
  const { operations, sideEffects } = spec.usecases;
  const { entities, relations } = spec.domain;

  const appMapDiagram = useMemo(
    () => buildAppMapDiagram(components, views, operations, sideEffects),
    [components, views, operations, sideEffects],
  );

  const erDiagram = useMemo(
    () => buildErDiagram(entities, relations),
    [entities, relations],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">{spec.name}</h2>

      {appMapDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">App Map</h3>
          <FlowDiagram data={appMapDiagram} />
        </section>
      )}

      {erDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Entity Relations</h3>
          <FlowDiagram data={erDiagram} />
        </section>
      )}

      {spec.specs.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Specs</h3>
          <div className="space-y-2">
            {spec.specs.map((s) => (
              <div key={s.id} className="rounded border border-gray-200 bg-white p-3">
                <span className="text-sm font-medium">{s.id}</span>
                <p className="mt-0.5 text-xs text-gray-500">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
