import { useSpec } from "@/hooks/useSpec";
import { RefLink } from "@/components/shared/RefLink";

export function ViewList() {
  const { spec } = useSpec();
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Views</h2>
      <div className="space-y-2">
        {spec.ui.views.map((v) => (
          <div
            key={v.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <RefLink to={`/views/${v.id}`}>
              <span className="font-medium">{v.id}</span>
            </RefLink>
            <div className="mt-1 text-sm text-gray-500">
              {v.components.length} components, {v.actions.length} actions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
