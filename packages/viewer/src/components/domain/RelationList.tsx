import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildErDiagram } from "./buildErDiagram";

export function RelationList() {
  const { spec } = useSpec();
  const erDiagram = buildErDiagram(spec.domain.entities, spec.domain.relations);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Relations</h2>

      {erDiagram && <MermaidDiagram chart={erDiagram} />}

      <div className="space-y-2">
        {spec.domain.relations.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3 text-sm"
          >
            <RefLink to={`/domain/entities/${r.from}`}>
              {r.from}
            </RefLink>
            <span className="text-gray-400">&rarr;</span>
            <Badge>{r.kind}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <RefLink to={`/domain/entities/${r.to}`}>
              {r.to}
            </RefLink>
          </div>
        ))}
      </div>
    </div>
  );
}
