import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

type RelationData = {
  sourceCardinality: string;
  targetCardinality: string;
};

export function RelationEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });

  const data = (props.data ?? {}) as RelationData;

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: "#6b7280" }} />
      <EdgeLabelRenderer>
        {props.label && (
          <div
            className="pointer-events-none absolute rounded bg-white px-1 text-[10px] text-gray-600"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {props.label}
          </div>
        )}
        {data.sourceCardinality && (
          <div
            className="pointer-events-none absolute text-[11px] font-bold text-gray-600"
            style={{ transform: `translate(-50%, -50%) translate(${props.sourceX + 14}px,${props.sourceY - 10}px)` }}
          >
            {data.sourceCardinality}
          </div>
        )}
        {data.targetCardinality && (
          <div
            className="pointer-events-none absolute text-[11px] font-bold text-gray-600"
            style={{ transform: `translate(-50%, -50%) translate(${props.targetX - 14}px,${props.targetY - 10}px)` }}
          >
            {data.targetCardinality}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
