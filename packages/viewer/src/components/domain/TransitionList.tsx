import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { StateArrow } from "@/components/shared/StateArrow";

export function TransitionList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Transitions</h2>
      <div className="space-y-2">
        {spec.domain.transitions.map((t) => (
          <div
            key={t.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <RefLink to={`/transitions/${t.id}`}>
              <span className="font-medium">{t.id}</span>
            </RefLink>
            <p className="mt-1 text-sm text-gray-600">{t.description}</p>
            <div className="mt-2 space-y-1">
              {t.changes.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <RefLink to={`/entities/${ch.entity}`}>
                    {ch.entity}
                  </RefLink>
                  <StateArrow from={ch.state.from} to={ch.state.to} />
                  <span className="text-xs text-gray-400">[{ch.scope}]</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
