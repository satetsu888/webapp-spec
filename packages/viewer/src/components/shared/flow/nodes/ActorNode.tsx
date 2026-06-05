import { Handle, Position } from "@xyflow/react";

type Props = {
  data: {
    label: string;
    _direction?: "RIGHT" | "DOWN";
  };
};

export function ActorNode({ data }: Props) {
  const horizontal = data._direction === "RIGHT";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="32" height="32" viewBox="0 0 24 24" className="fill-gray-600">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
      <span className="text-[11px] font-medium text-gray-700">{data.label}</span>
      <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}
