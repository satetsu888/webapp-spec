import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkUsecases(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const usecaseMap = new Map(spec.usecases.map((u) => [u.id, u]));
  const actorMap = new Map(spec.actors.map((a) => [a.id, a]));
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));
  const transitionMap = new Map(spec.domain.transitions.map((t) => [t.id, t]));

  for (let i = 0; i < spec.usecases.length; i++) {
    const uc = spec.usecases[i];

    // Transition target consistency
    const transition = uc.transition ? transitionMap.get(uc.transition) : undefined;
    if (transition) {
      const targetEntityIds = transition.changes
        .filter((c) => c.scope === "target")
        .map((c) => c.entity);
      if (targetEntityIds.length > 0 && !targetEntityIds.includes(uc.target.entity)) {
        issues.push({
          severity: "error",
          rule: "usecase.transition-target",
          message: `Usecase "${uc.id}" target entity "${uc.target.entity}" does not match transition "${uc.transition}" target entity (${targetEntityIds.join(", ")})`,
          path: `usecases[${i}]`,
        });
      }
    }

    // Anonymous actor accessing owned resources
    const actor = actorMap.get(uc.actor);
    const entity = entityMap.get(uc.target.entity);
    if (actor && entity && actor.authState.kind === "anonymous") {
      if (entity.ownership.kind === "personal" || entity.ownership.kind === "group" || entity.ownership.kind === "participants") {
        issues.push({
          severity: "warning",
          rule: "usecase.anonymous-ownership",
          message: `Usecase "${uc.id}" uses anonymous actor to access ${entity.ownership.kind} resource "${uc.target.entity}"`,
          path: `usecases[${i}]`,
        });
      }
    }

    // followUp checks
    if (uc.followUps) {
      for (let j = 0; j < uc.followUps.length; j++) {
        const followUp = uc.followUps[j];
        const followUpUc = usecaseMap.get(followUp.usecase);
        if (followUpUc) {
          const followUpActor = actorMap.get(followUpUc.actor);
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
                rule: "usecase.followup-actor",
                message: `Usecase "${uc.id}" followUp "${followUp.usecase}" is defined with human actor "${followUpUc.actor}" (followUps typically use external system actors)`,
                path: `usecases[${i}].followUps[${j}]`,
              });
            }
          }
        }
      }

      // Cycle detection
      const visited = new Set<string>();
      const stack = uc.followUps.map((f) => f.usecase);
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === uc.id) {
          issues.push({
            severity: "warning",
            rule: "usecase.followup-cycle",
            message: `Usecase "${uc.id}" has a circular reference in followUps`,
            path: `usecases[${i}].followUps`,
          });
          break;
        }
        if (visited.has(current)) continue;
        visited.add(current);
        const nextUc = usecaseMap.get(current);
        if (nextUc?.followUps) {
          stack.push(...nextUc.followUps.map((f) => f.usecase));
        }
      }
    }
  }

  return issues;
}
