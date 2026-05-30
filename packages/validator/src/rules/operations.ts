import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkOperations(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const operationMap = new Map(spec.usecases.operations.map((o) => [o.id, o]));
  const actorMap = new Map(spec.usecases.actors.map((a) => [a.id, a]));
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));
  const transitionMap = new Map(spec.domain.transitions.map((t) => [t.id, t]));

  for (let i = 0; i < spec.usecases.operations.length; i++) {
    const op = spec.usecases.operations[i];

    // Transition target consistency
    const transition = op.transition ? transitionMap.get(op.transition) : undefined;
    if (transition) {
      const targetEntityIds = transition.changes
        .filter((c) => c.scope === "target")
        .map((c) => c.entity);
      if (targetEntityIds.length > 0 && !targetEntityIds.includes(op.target.entity)) {
        issues.push({
          severity: "error",
          rule: "operation.transition-target",
          message: `Operation "${op.id}" target entity "${op.target.entity}" does not match transition "${op.transition}" target entity (${targetEntityIds.join(", ")})`,
          path: `usecases.operations[${i}]`,
        });
      }
    }

    // Anonymous actor accessing owned resources
    const actor = actorMap.get(op.actor);
    const entity = entityMap.get(op.target.entity);
    if (actor && entity && actor.authState.kind === "anonymous") {
      if (entity.ownership.kind === "personal" || entity.ownership.kind === "group" || entity.ownership.kind === "participants") {
        issues.push({
          severity: "warning",
          rule: "operation.anonymous-ownership",
          message: `Operation "${op.id}" uses anonymous actor to access ${entity.ownership.kind} resource "${op.target.entity}"`,
          path: `usecases.operations[${i}]`,
        });
      }
    }

    // followUp checks
    if (op.followUps) {
      for (let j = 0; j < op.followUps.length; j++) {
        const followUp = op.followUps[j];
        const followUpOp = operationMap.get(followUp.operation);
        if (followUpOp) {
          const followUpActor = actorMap.get(followUpOp.actor);
          if (followUpActor && followUpActor.authState.kind !== "authenticated") {
            continue;
          }
          if (followUpActor && followUpActor.authState.kind === "authenticated") {
            const isHumanLike = followUpActor.authState.roles.some(
              (r) => ["member", "admin", "user", "owner", "editor", "viewer"].includes(r),
            );
            if (isHumanLike) {
              issues.push({
                severity: "warning",
                rule: "operation.followup-actor",
                message: `Operation "${op.id}" followUp "${followUp.operation}" is defined with human actor "${followUpOp.actor}" (followUps typically use external system actors)`,
                path: `usecases.operations[${i}].followUps[${j}]`,
              });
            }
          }
        }
      }

      // Cycle detection
      const visited = new Set<string>();
      const stack = op.followUps.map((f) => f.operation);
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === op.id) {
          issues.push({
            severity: "warning",
            rule: "operation.followup-cycle",
            message: `Operation "${op.id}" has a circular reference in followUps`,
            path: `usecases.operations[${i}].followUps`,
          });
          break;
        }
        if (visited.has(current)) continue;
        visited.add(current);
        const nextOp = operationMap.get(current);
        if (nextOp?.followUps) {
          stack.push(...nextOp.followUps.map((f) => f.operation));
        }
      }
    }
  }

  return issues;
}
