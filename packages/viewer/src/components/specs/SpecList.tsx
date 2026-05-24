import { useSpec } from "@/hooks/useSpec";

export function SpecList() {
  const { spec } = useSpec();

  if (spec.specs.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-bold">Specs</h2>
        <p className="text-sm text-gray-500">No specs defined</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Specs</h2>
      <div className="space-y-2">
        {spec.specs.map((s) => (
          <div
            key={s.id}
            className="rounded border border-gray-200 bg-white p-4"
          >
            <span className="font-medium">{s.id}</span>
            <p className="mt-1 text-sm text-gray-600">{s.description}</p>
            {s.rules.length > 0 && (
              <pre className="mt-2 rounded bg-gray-50 p-2 text-xs">
                {JSON.stringify(s.rules, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
