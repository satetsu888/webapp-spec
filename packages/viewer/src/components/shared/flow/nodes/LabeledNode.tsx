import { Handle, Position } from "@xyflow/react";

type Props = {
  data: {
    label: string;
    sublabel?: string;
    href?: string;
    variant?: "default" | "hexagon" | "entity";
    _direction?: "RIGHT" | "DOWN";
  };
};

const variantStyles: Record<string, string> = {
  default: "rounded-md border-gray-300 bg-white",
  hexagon: "rounded-lg border-amber-300 bg-amber-50",
  entity: "rounded-md border-teal-400 bg-teal-50",
};

const cylinderIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-teal-500">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>
);

export function LabeledNode({ data }: Props) {
  const variant = data.variant ?? "default";
  const horizontal = data._direction === "RIGHT";

  return (
    <div className={`border px-4 py-2 shadow-sm ${variantStyles[variant]}`}>
      {variant === "entity" ? (
        <div className="flex items-center gap-1.5">
          {cylinderIcon}
          <span className="text-xs font-medium text-teal-800">{data.label}</span>
        </div>
      ) : (
        <div className="text-xs font-medium text-gray-800 whitespace-pre-line">{data.label}</div>
      )}
      {data.sublabel && (
        <div className="mt-0.5 text-[11px] text-gray-500 whitespace-pre-line">{data.sublabel}</div>
      )}
      <Handle type="target" position={horizontal ? Position.Left : Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={horizontal ? Position.Right : Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}
