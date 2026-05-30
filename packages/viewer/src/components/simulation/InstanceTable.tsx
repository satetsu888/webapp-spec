import { useSimulation } from "@/hooks/useSimulation";
import { Badge } from "@/components/shared/Badge";

export function InstanceTable() {
  const { state } = useSimulation();

  const entityTypes = Object.keys(state.instances).filter(
    (k) => state.instances[k].length > 0,
  );

  if (entityTypes.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No entity instances yet. Execute a creation operation to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Entity Instances
      </h3>
      {entityTypes.map((entityType) => (
        <div key={entityType}>
          <h4 className="mb-1 text-sm font-medium">{entityType}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-1 pr-3">ID</th>
                <th className="pb-1">Fields</th>
              </tr>
            </thead>
            <tbody>
              {state.instances[entityType].map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100">
                  <td className="py-1 pr-3 font-mono text-xs">{inst.id}</td>
                  <td className="py-1">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(inst.fields).map(([k, v]) => (
                        <Badge key={k} variant="gray">
                          {k}={String(v)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
