import type { Entity, Relation } from "@webapp-spec/types";
import type { Node, Edge } from "@xyflow/react";
import type { FlowData } from "@/components/shared/flow/types";

function cardinality(kind: Relation["kind"]): { source: string; target: string } {
  switch (kind) {
    case "hasMany":
      return { source: "1", target: "*" };
    case "belongsTo":
      return { source: "*", target: "1" };
    case "manyToMany":
      return { source: "*", target: "*" };
  }
}

export function buildErDiagram(
  entities: Entity[],
  relations: Relation[],
): FlowData | null {
  if (relations.length === 0) return null;

  const referencedEntityIds = new Set<string>();
  for (const r of relations) {
    referencedEntityIds.add(r.from);
    referencedEntityIds.add(r.to);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const entity of entities) {
    if (!referencedEntityIds.has(entity.id)) continue;
    nodes.push({
      id: entity.id,
      type: "entitySchema",
      position: { x: 0, y: 0 },
      data: {
        label: entity.id,
        fields: entity.fields.map((f) => ({ name: f.name, type: f.type })),
        href: `/domain/entities/${entity.id}`,
      },
    });
  }

  for (const r of relations) {
    const c = cardinality(r.kind);
    edges.push({
      id: `rel_${r.id}`,
      source: r.from,
      target: r.to,
      type: "relation",
      label: r.id,
      data: { sourceCardinality: c.source, targetCardinality: c.target },
    });
  }

  return { nodes, edges, direction: "RIGHT" };
}
