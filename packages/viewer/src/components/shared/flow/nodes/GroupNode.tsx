import { Handle, Position } from "@xyflow/react";

export function GroupNode({ data }: { data: { label?: string } }) {
  return (
    <div className="h-full w-full rounded-lg border border-gray-300 bg-gray-50/50">
      {data.label && (
        <div className="absolute -top-2.5 left-3 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
          {data.label}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="s-right" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" />
      <Handle type="target" position={Position.Left} id="t-left" />
      <Handle type="target" position={Position.Top} id="t-top" />
    </div>
  );
}

export function GroupLabelNode({ data }: { data: { label: string } }) {
  return (
    <div className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
      {data.label}
    </div>
  );
}
