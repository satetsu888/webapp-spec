import { useSpec } from "@/hooks/useSpec";
import { useSimulation } from "@/hooks/useSimulation";

export function ActorInstanceSelector() {
  const { actorMap } = useSpec();
  const { state, bindActorInstance } = useSimulation();

  if (!state.selectedActor) return null;

  const actor = actorMap.get(state.selectedActor);
  if (!actor?.entity) return null;

  const instances = state.instances[actor.entity] ?? [];
  const boundId = state.actorInstances[actor.id];

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Operating as ({actor.entity})
      </h3>
      <select
        value={boundId ?? ""}
        onChange={(e) => bindActorInstance(actor.id, e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="">-- select {actor.entity} instance --</option>
        {instances.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.id} ({JSON.stringify(inst.fields)})
          </option>
        ))}
      </select>
    </div>
  );
}
