import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function UsecaseList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Usecases</h2>
      <div className="space-y-2">
        {spec.usecases.map((u) => (
          <div
            key={u.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <RefLink section="usecases" itemId={u.id}>
                <span className="font-medium">{u.id}</span>
              </RefLink>
              <Badge variant="green">{u.actor}</Badge>
              <RefLink
                section="entities"
                itemId={u.target.entity}
                className="text-sm"
              >
                {u.target.entity}
              </RefLink>
            </div>
            <p className="mt-1 text-sm text-gray-600">{u.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
