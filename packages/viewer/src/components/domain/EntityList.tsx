import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function EntityList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Entities</h2>
      <div className="space-y-2">
        {spec.domain.entities.map((e) => (
          <div
            key={e.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <RefLink to={`/entities/${e.id}`}>
                <span className="font-medium">{e.id}</span>
              </RefLink>
              <Badge variant="purple">{e.ownership.kind}</Badge>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {e.fields.length} fields, {e.states.length} states
              {e.traits.length > 0 && `, ${e.traits.length} traits`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
