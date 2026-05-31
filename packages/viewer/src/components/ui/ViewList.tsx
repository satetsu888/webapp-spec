import { useMemo } from "react";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import type { View } from "@webapp-spec/types";

export function ViewList() {
  const { spec, operationMap } = useSpec();

  const viewsByActor = useMemo(() => {
    const groups = new Map<string, View[]>();
    for (const view of spec.ui.views) {
      const actors = new Set<string>();
      for (const action of view.actions) {
        const op = operationMap.get(action.operation);
        if (op) actors.add(op.actor);
      }
      if (actors.size === 0) actors.add("_none");
      for (const actor of actors) {
        const list = groups.get(actor) ?? [];
        list.push(view);
        groups.set(actor, list);
      }
    }
    return groups;
  }, [spec, operationMap]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Views</h2>
      <div className="space-y-6">
        {spec.usecases.actors.map((actor) => {
          const views = viewsByActor.get(actor.id);
          if (!views || views.length === 0) return null;
          return (
            <section key={actor.id}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Badge variant="green">{actor.id}</Badge>
                <span className="text-xs font-normal text-gray-400">
                  ({views.length})
                </span>
              </h3>
              <div className="space-y-2">
                {views.map((v) => (
                  <ViewCard key={v.id} view={v} />
                ))}
              </div>
            </section>
          );
        })}
        {viewsByActor.has("_none") && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">
              No actions
            </h3>
            <div className="space-y-2">
              {viewsByActor.get("_none")!.map((v) => (
                <ViewCard key={v.id} view={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ViewCard({ view }: { view: View }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <RefLink to={`/ui/views/${view.id}`}>
        <span className="font-medium">{view.id}</span>
      </RefLink>
      <div className="mt-1 text-sm text-gray-500">
        {view.components.length} components, {view.actions.length} actions
      </div>
    </div>
  );
}
