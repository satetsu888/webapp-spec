import { Handle, Position } from "@xyflow/react";

type Props = {
  data: {
    label: string;
    href?: string;
    _direction?: "RIGHT" | "DOWN";
  };
};

export function OperationNode({ data }: Props) {
  const horizontal = data._direction === "RIGHT";

  return (
    <div className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-800 shadow-sm whitespace-pre-line">
      {data.label}
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} className="!w-2 !h-2 !bg-blue-300" />
      <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} className="!w-2 !h-2 !bg-blue-300" />
    </div>
  );
}
