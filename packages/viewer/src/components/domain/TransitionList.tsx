import { useMemo } from "react";
import type { Transition } from "@webapp-spec/types";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { StateArrow } from "@/components/shared/StateArrow";

function groupByTargetEntity(
  transitions: Transition[],
  entityIds: string[],
): Map<string, Transition[]> {
  const groups = new Map<string, Transition[]>();
  for (const entityId of entityIds) {
    groups.set(entityId, []);
  }
  for (const t of transitions) {
    const targetEntity = t.changes.find((ch) => ch.scope === "target")?.entity;
    const key = targetEntity ?? "_other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return groups;
}

export function TransitionList() {
  const { spec } = useSpec();
  const grouped = useMemo(
    () =>
      groupByTargetEntity(
        spec.domain.transitions,
        spec.domain.entities.map((e) => e.id),
      ),
    [spec],
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Transitions</h2>
      <div className="space-y-6">
        {[...grouped.entries()].map(([entityId, transitions]) => {
          if (transitions.length === 0) return null;
          return (
            <section key={entityId}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Badge variant="blue">{entityId}</Badge>
                <span className="text-xs font-normal text-gray-400">
                  ({transitions.length})
                </span>
              </h3>
              <div className="space-y-2">
                {transitions.map((t) => (
                  <div
                    key={t.id}
                    className="rounded border border-gray-200 bg-white p-4"
                  >
                    <RefLink to={`/transitions/${t.id}`}>
                      <span className="font-medium">{t.id}</span>
                    </RefLink>
                    <p className="mt-1 text-sm text-gray-600">
                      {t.description}
                    </p>
                    <div className="mt-2 space-y-1">
                      {t.changes.map((ch, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <RefLink to={`/entities/${ch.entity}`}>
                            {ch.entity}
                          </RefLink>
                          <StateArrow
                            entity={ch.entity}
                            from={ch.state.from}
                            to={ch.state.to}
                          />
                          <span className="text-xs text-gray-400">
                            [{ch.scope}]
                          </span>
                        </div>
                      ))}
                    </div>
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
