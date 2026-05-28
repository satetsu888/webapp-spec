import { useMemo } from "react";
import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildScenarioFlowDiagram } from "./buildScenarioFlowDiagram";

export function ScenarioDetail() {
  const { id } = useParams<{ id: string }>();
  const { scenarioMap } = useSpec();
  const scenario = scenarioMap.get(id!);
  if (!scenario)
    return <p className="text-red-600">Scenario "{id}" not found</p>;

  const flowDiagram = useMemo(
    () => buildScenarioFlowDiagram(scenario),
    [scenario],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{scenario.id}</h2>
        <Badge variant="green">{scenario.actor}</Badge>
        <p className="mt-1 text-sm text-gray-600">{scenario.goal}</p>
      </div>

      {flowDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Scenario Flow
          </h3>
          <MermaidDiagram chart={flowDiagram} />
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Steps</h3>
        <ol className="space-y-2">
          {scenario.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded border border-gray-100 bg-white p-3 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                {i + 1}
              </span>
              {typeof step === "string" ? (
                <RefLink to={`/scenarios/${step}`}>
                  {step}
                </RefLink>
              ) : "view" in step ? (
                <>
                  <RefLink to={`/views/${step.view}`}>
                    {step.view}
                  </RefLink>
                  {step.action && (
                    <>
                      <span className="text-gray-400">&rarr;</span>
                      <RefLink to={`/usecases/${step.action}`}>
                        {step.action}
                      </RefLink>
                    </>
                  )}
                  {step.description && (
                    <span className="text-gray-500">{step.description}</span>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="gray">background</Badge>
                  <RefLink to={`/usecases/${step.usecase}`}>
                    {step.usecase}
                  </RefLink>
                  <Badge variant="green">{step.actor}</Badge>
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
