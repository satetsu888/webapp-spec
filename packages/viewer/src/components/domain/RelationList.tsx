import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function RelationList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Relations</h2>
      <div className="space-y-2">
        {spec.domain.relations.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3 text-sm"
          >
            <RefLink to={`/entities/${r.from}`}>
              {r.from}
            </RefLink>
            <span className="text-gray-400">&rarr;</span>
            <Badge>{r.kind}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <RefLink to={`/entities/${r.to}`}>
              {r.to}
            </RefLink>
          </div>
        ))}
      </div>
    </div>
  );
}
