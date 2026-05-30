import { useMemo } from "react";
import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildOperationImpactDiagram } from "./buildOperationImpactDiagram";

export function OperationDetail() {
  const { id } = useParams<{ id: string }>();
  const { operationMap, transitionMap, sideEffectsByOperation, spec } = useSpec();
  const op = operationMap.get(id!);
  if (!op) return <p className="text-red-600">Operation "{id}" not found</p>;

  const sideEffects = sideEffectsByOperation(id!);

  const impactDiagram = useMemo(
    () => buildOperationImpactDiagram(op, transitionMap, sideEffects),
    [op, transitionMap, sideEffects],
  );
  const scenarios = spec.scenarios.filter((s) =>
    s.steps.some(
      (step) =>
        typeof step !== "string" &&
        (("view" in step && step.action === id) ||
          ("operation" in step && step.operation === id)),
    ),
  );
  const views = spec.ui.views.filter((v) =>
    v.actions.some((a) => a.operation === id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{op.id}</h2>
        <p className="text-sm text-gray-600">{op.description}</p>
      </div>

      {impactDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Impact Flow
          </h3>
          <MermaidDiagram chart={impactDiagram} />
        </section>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500">Actor: </span>
          <Badge variant="green">{op.actor}</Badge>
        </div>
        <div>
          <span className="text-gray-500">Target: </span>
          <RefLink to={`/entities/${op.target.entity}`}>
            {op.target.entity}
          </RefLink>
          <Badge variant="gray" >
            {op.target.kind}
          </Badge>
        </div>
        <div>
          {op.transition ? (
            <>
              <span className="text-gray-500">Transition: </span>
              <RefLink to={`/transitions/${op.transition}`}>
                {op.transition}
              </RefLink>
            </>
          ) : (
            <Badge variant="purple">Query</Badge>
          )}
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Input</h3>
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(op.input).map(([key, type]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="py-1 pr-4 font-mono text-xs">{key}</td>
                <td className="py-1 font-mono text-xs text-gray-600">
                  {type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {op.conditions && op.conditions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Conditions
          </h3>
          <pre className="rounded bg-gray-50 p-3 text-xs">
            {JSON.stringify(op.conditions, null, 2)}
          </pre>
        </section>
      )}

      {op.errors.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Errors</h3>
          <div className="space-y-1">
            {op.errors.map((e) => (
              <div key={e.when} className="text-sm">
                <Badge variant="red">{e.when}</Badge>
                <span className="ml-2 text-gray-600">{e.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {op.followUps && op.followUps.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Follow-ups
          </h3>
          <div className="space-y-1">
            {op.followUps.map((fu) => (
              <div key={fu.operation} className="text-sm">
                <RefLink to={`/operations/${fu.operation}`}>
                  {fu.operation}
                </RefLink>
                <span className="ml-2 text-gray-500">{fu.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {sideEffects.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Side Effects
          </h3>
          <div className="space-y-1">
            {sideEffects.map((se, i) => (
              <div key={i} className="text-sm text-gray-600">
                {se.description}
              </div>
            ))}
          </div>
        </section>
      )}

      {scenarios.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used in Scenarios
          </h3>
          <div className="space-y-1">
            {scenarios.map((s) => (
              <div key={s.id} className="text-sm">
                <RefLink to={`/scenarios/${s.id}`}>
                  {s.id}
                </RefLink>
              </div>
            ))}
          </div>
        </section>
      )}

      {views.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used in Views
          </h3>
          <div className="space-y-1">
            {views.map((v) => (
              <div key={v.id} className="text-sm">
                <RefLink to={`/views/${v.id}`}>
                  {v.id}
                </RefLink>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
