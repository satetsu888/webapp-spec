import { useMemo } from "react";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildReactionFlowDiagram } from "./buildReactionFlowDiagram";
import type { NotificationTarget } from "@webapp-spec/types";

function formatTarget(target: NotificationTarget): { label: string; variant: "blue" | "green" | "purple" } {
  if ("actor" in target) return { label: `actor: ${target.actor}`, variant: "green" };
  if ("owner" in target) return { label: `owner of ${target.owner}`, variant: "blue" };
  return { label: `external: ${target.external}`, variant: "purple" };
}

export function ReactionList() {
  const { spec } = useSpec();

  if (spec.reactions.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-bold">Reactions</h2>
        <p className="text-sm text-gray-500">No reactions defined</p>
      </div>
    );
  }

  const diagram = useMemo(
    () => buildReactionFlowDiagram(spec.reactions),
    [spec.reactions],
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Reactions</h2>
      {diagram && (
        <div className="mb-4">
          <MermaidDiagram chart={diagram} />
        </div>
      )}
      <div className="space-y-2">
        {spec.reactions.map((r, i) => {
          const { label, variant } = formatTarget(r.notify);
          return (
            <div
              key={i}
              className="rounded border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">When</span>
                <RefLink to={`/usecases/${r.trigger.usecase}`}>
                  {r.trigger.usecase}
                </RefLink>
                <span className="text-gray-400">&rarr;</span>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">{r.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
