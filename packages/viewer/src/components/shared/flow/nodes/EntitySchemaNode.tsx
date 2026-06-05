import { Handle, Position } from "@xyflow/react";

type Props = {
  data: {
    label: string;
    fields: { name: string; type: string }[];
    href?: string;
    _direction?: "RIGHT" | "DOWN";
  };
};

export function EntitySchemaNode({ data }: Props) {
  const horizontal = data._direction === "RIGHT";

  return (
    <div className="min-w-[200px] overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-300 bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
        {data.label}
      </div>
      <div className="divide-y divide-gray-100">
        {data.fields.map((f) => (
          <div key={f.name} className="flex justify-between gap-4 px-3 py-1 text-[11px]">
            <span className="font-medium text-gray-800">{f.name}</span>
            <span className="text-gray-400">{f.type}</span>
          </div>
        ))}
      </div>
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}
