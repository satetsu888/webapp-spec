import type { Entity, Relation } from "@webapp-spec/types";

export function buildErDiagram(
  entities: Entity[],
  relations: Relation[],
): string | null {
  if (relations.length === 0) return null;

  const referencedEntityIds = new Set<string>();
  for (const r of relations) {
    referencedEntityIds.add(r.from);
    referencedEntityIds.add(r.to);
  }

  const lines = ["erDiagram"];

  for (const entity of entities) {
    if (!referencedEntityIds.has(entity.id)) continue;
    lines.push(`    ${entity.id} {`);
    for (const f of entity.fields) {
      const safeType = sanitizeType(f.type);
      lines.push(`        ${safeType} ${f.name}`);
    }
    lines.push("    }");
  }

  for (const r of relations) {
    const notation = relationNotation(r.kind);
    lines.push(`    ${r.from} ${notation} ${r.to} : "${r.id}"`);
  }

  return lines.join("\n");
}

function sanitizeType(type: string): string {
  return type.replace(/\./g, "_");
}

function relationNotation(kind: Relation["kind"]): string {
  switch (kind) {
    case "hasMany":
      return "||--o{";
    case "belongsTo":
      return "}o--||";
    case "manyToMany":
      return "}o--o{";
  }
}
