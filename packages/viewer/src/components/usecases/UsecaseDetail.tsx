import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";

export function UsecaseDetail({ id }: { id: string }) {
  const { usecaseMap, reactionsByUsecase, spec } = useSpec();
  const uc = usecaseMap.get(id);
  if (!uc) return <p className="text-red-600">Usecase "{id}" not found</p>;

  const reactions = reactionsByUsecase(id);
  const journeys = spec.journeys.filter((j) =>
    j.steps.some((s) => typeof s !== "string" && s.usecase === id),
  );
  const views = spec.ui.views.filter((v) =>
    v.actions.some((a) => a.usecase === id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{uc.id}</h2>
        <p className="text-sm text-gray-600">{uc.description}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500">Actor: </span>
          <Badge variant="green">{uc.actor}</Badge>
        </div>
        <div>
          <span className="text-gray-500">Target: </span>
          <RefLink section="entities" itemId={uc.target.entity}>
            {uc.target.entity}
          </RefLink>
          <Badge variant="gray" >
            {uc.target.kind}
          </Badge>
        </div>
        <div>
          <span className="text-gray-500">Transition: </span>
          <RefLink section="transitions" itemId={uc.transition}>
            {uc.transition}
          </RefLink>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Input</h3>
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(uc.input).map(([key, type]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="py-1 pr-4 font-mono text-xs">{key}</td>
                <td className="py-1 font-mono text-xs text-gray-600">
                  {type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {uc.errors.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Errors</h3>
          <div className="space-y-1">
            {uc.errors.map((e) => (
              <div key={e.when} className="text-sm">
                <Badge variant="red">{e.when}</Badge>
                <span className="ml-2 text-gray-600">{e.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {uc.followUps && uc.followUps.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Follow-ups
          </h3>
          <div className="space-y-1">
            {uc.followUps.map((fu) => (
              <div key={fu.usecase} className="text-sm">
                <RefLink section="usecases" itemId={fu.usecase}>
                  {fu.usecase}
                </RefLink>
                <span className="ml-2 text-gray-500">{fu.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {reactions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Reactions
          </h3>
          <div className="space-y-1">
            {reactions.map((r, i) => (
              <div key={i} className="text-sm text-gray-600">
                {r.description}
              </div>
            ))}
          </div>
        </section>
      )}

      {journeys.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used in Journeys
          </h3>
          <div className="space-y-1">
            {journeys.map((j) => (
              <div key={j.id} className="text-sm">
                <RefLink section="journeys" itemId={j.id}>
                  {j.id}
                </RefLink>
              </div>
            ))}
          </div>
        </section>
      )}

      {views.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Used in Views
          </h3>
          <div className="space-y-1">
            {views.map((v) => (
              <div key={v.id} className="text-sm">
                <RefLink section="views" itemId={v.id}>
                  {v.id}
                </RefLink>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
