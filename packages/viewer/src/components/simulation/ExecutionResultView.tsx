import type { ExecutionResult } from "@/engine/types";
import type { NotificationTarget } from "@webapp-spec/types";
import { Badge } from "@/components/shared/Badge";

function formatNotify(target: NotificationTarget): string {
  if ("actor" in target) return `actor: ${target.actor}`;
  if ("owner" in target) return `owner of ${target.owner}`;
  return `external: ${target.external}`;
}

export function ExecutionResultView({ result }: { result: ExecutionResult }) {
  return (
    <div
      className={`rounded border p-4 ${
        result.success
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={result.success ? "green" : "red"}>
          {result.success ? "Success" : "Failed"}
        </Badge>
        <span className="text-sm font-medium">{result.usecaseId}</span>
      </div>

      {result.error && (
        <p className="mb-2 text-sm text-red-700">{result.error}</p>
      )}

      {result.mutations.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-gray-600">
            Mutations:
          </span>
          <div className="mt-1 space-y-1">
            {result.mutations.map((m, i) => (
              <div key={i} className="text-xs">
                {m.kind === "created" && (
                  <span>
                    <Badge variant="green">created</Badge>{" "}
                    {m.entity} "{m.instance.id}"
                  </span>
                )}
                {m.kind === "stateChanged" && (
                  <span>
                    <Badge variant="blue">changed</Badge>{" "}
                    {m.entity} "{m.instanceId}" {m.field}: {m.from} &rarr;{" "}
                    {m.to}
                  </span>
                )}
                {m.kind === "deleted" && (
                  <span>
                    <Badge variant="red">deleted</Badge>{" "}
                    {m.entity} "{m.instanceId}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.firedReactions.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-gray-600">
            Reactions:
          </span>
          <div className="mt-1 space-y-1">
            {result.firedReactions.map((r, i) => (
              <div key={i} className="text-xs">
                <Badge variant="purple">{formatNotify(r.notify)}</Badge>{" "}
                {r.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
