import { Handle, Position } from "@xyflow/react";

type Props = {
  data: {
    label: string;
    variant: "start" | "end" | "normal";
  };
};

export function StateNode({ data }: Props) {
  if (data.variant === "start") {
    return (
      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-800">
        <Handle type="source" position={Position.Bottom} id="s-bottom" />
      </div>
    );
  }

  if (data.variant === "end") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-800">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-800" />
        <Handle type="target" position={Position.Top} id="t-top" />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 shadow-sm">
      {data.label}
      <Handle type="target" position={Position.Top} id="t-top" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" />
      <Handle type="target" position={Position.Right} id="t-right" />
      <Handle type="source" position={Position.Right} id="s-right" />
    </div>
  );
}
