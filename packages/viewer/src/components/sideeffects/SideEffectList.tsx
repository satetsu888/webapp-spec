import { useMemo } from "react";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildSideEffectFlowDiagram } from "./buildSideEffectFlowDiagram";
import type { NotificationTarget } from "@webapp-spec/types";

function formatTarget(target: NotificationTarget): { label: string; variant: "blue" | "green" | "purple" } {
  if ("actor" in target) return { label: `actor: ${target.actor}`, variant: "green" };
  if ("owner" in target) return { label: `owner of ${target.owner}`, variant: "blue" };
  return { label: `external: ${target.external}`, variant: "purple" };
}

export function SideEffectList() {
  const { spec } = useSpec();

  if (spec.usecases.sideEffects.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-bold">Side Effects</h2>
        <p className="text-sm text-gray-500">No side effects defined</p>
      </div>
    );
  }

  const diagram = useMemo(
    () => buildSideEffectFlowDiagram(spec.usecases.sideEffects),
    [spec.usecases.sideEffects],
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Side Effects</h2>
      {diagram && (
        <div className="mb-4">
          <MermaidDiagram chart={diagram} />
        </div>
      )}
      <div className="space-y-2">
        {spec.usecases.sideEffects.map((se, i) => {
          const { label, variant } = formatTarget(se.notify);
          return (
            <div
              key={i}
              className="rounded border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">When</span>
                <RefLink to={`/operations/${se.trigger.operation}`}>
                  {se.trigger.operation}
                </RefLink>
                <span className="text-gray-400">&rarr;</span>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">{se.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
