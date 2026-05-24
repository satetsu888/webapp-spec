import { useMemo } from "react";
import { useParams } from "react-router";
import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";
import { Badge } from "@/components/shared/Badge";
import { StateArrow } from "@/components/shared/StateArrow";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";
import { buildStateDiagram } from "./buildStateDiagram";

export function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const { entityMap, relationsForEntity, transitionsForEntity } = useSpec();
  const entity = entityMap.get(id!);
  if (!entity) return <p className="text-red-600">Entity "{id}" not found</p>;

  const relations = relationsForEntity(id!);
  const transitions = transitionsForEntity(id!);
  const stateDiagram = useMemo(
    () => buildStateDiagram(id!, transitions),
    [id, transitions],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{entity.id}</h2>
        <Badge variant="purple">{entity.ownership.kind}</Badge>
        {"ownerField" in entity.ownership && (
          <span className="ml-2 text-sm text-gray-500">
            owner: {entity.ownership.ownerField}
          </span>
        )}
        {"groupField" in entity.ownership && (
          <span className="ml-2 text-sm text-gray-500">
            group: {entity.ownership.groupField}
          </span>
        )}
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Fields</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-1 pr-4">Name</th>
              <th className="pb-1 pr-4">Type</th>
              <th className="pb-1">Required</th>
            </tr>
          </thead>
          <tbody>
            {entity.fields.map((f) => (
              <tr key={f.name} className="border-b border-gray-100">
                <td className="py-1 pr-4 font-mono text-xs">{f.name}</td>
                <td className="py-1 pr-4">
                  {f.type.includes(".") ? (
                    <RefLink
                      to={`/entities/${f.type.split(".")[0]}`}
                      className="font-mono text-xs"
                    >
                      {f.type}
                    </RefLink>
                  ) : (
                    <span className="font-mono text-xs">{f.type}</span>
                  )}
                </td>
                <td className="py-1">
                  {f.required === false ? (
                    <Badge variant="yellow">optional</Badge>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {entity.states.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">States</h3>
          <div className="flex flex-wrap gap-2">
            {entity.states.map((s) => (
              <div
                key={s.name}
                className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
              >
                <Badge variant="blue">{s.name}</Badge>
                <span className="ml-2 text-xs text-gray-500">
                  {s.field}={s.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stateDiagram && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            State Diagram
          </h3>
          <MermaidDiagram chart={stateDiagram} />
        </section>
      )}

      {entity.traits.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Traits</h3>
          <div className="space-y-1">
            {entity.traits.map((t) => (
              <div key={t.name} className="text-sm">
                <Badge variant="green">{t.name}</Badge>
                <span className="ml-2 text-gray-600">{t.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {relations.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Relations
          </h3>
          <div className="space-y-1">
            {relations.map((r) => {
              const other = r.from === id ? r.to : r.from;
              const direction = r.from === id ? "to" : "from";
              return (
                <div key={r.id} className="text-sm">
                  <span className="text-gray-500">{r.kind}</span>
                  <span className="mx-1 text-gray-400">
                    ({direction})
                  </span>
                  <RefLink to={`/entities/${other}`}>
                    {other}
                  </RefLink>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {transitions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Transitions
          </h3>
          <div className="space-y-1">
            {transitions.map((t) => (
              <div key={t.id} className="text-sm">
                <RefLink to={`/transitions/${t.id}`}>
                  {t.id}
                </RefLink>
                <span className="ml-2">
                  {t.changes
                    .filter((ch) => ch.entity === id)
                    .map((ch, i) => (
                      <StateArrow
                        key={i}
                        from={ch.state.from}
                        to={ch.state.to}
                      />
                    ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
