import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function ActorList() {
  const { spec, operationsByActor } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Actors</h2>
      <div className="space-y-2">
        {spec.usecases.actors.map((a) => {
          const ops = operationsByActor(a.id);
          return (
            <div
              key={a.id}
              className="rounded border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.id}</span>
                <Badge
                  variant={
                    a.authState.kind === "authenticated" ? "green" : "yellow"
                  }
                >
                  {a.authState.kind}
                </Badge>
                {"roles" in a.authState &&
                  a.authState.roles.map((r) => (
                    <Badge key={r} variant="purple">
                      {r}
                    </Badge>
                  ))}
              </div>
              {ops.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-xs text-gray-500">Operations:</span>
                  {ops.map((u) => (
                    <div key={u.id} className="ml-2 text-sm">
                      <RefLink to={`/operations/${u.id}`}>
                        {u.id}
                      </RefLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
