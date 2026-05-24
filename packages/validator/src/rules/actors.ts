import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkActors(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const hasAnonymous = spec.actors.some((a) => a.authState.kind === "anonymous");
  if (!hasAnonymous) {
    issues.push({
      severity: "warning",
      rule: "actor.no-anonymous",
      message: `No anonymous actor defined — web applications are inherently accessible by unauthenticated users`,
      path: "actors",
    });
  }

  return issues;
}
