import type { WebAppSpec } from "@webapp-spec/types";
import { checkReferences } from "./rules/references.js";
import { checkUniqueness } from "./rules/uniqueness.js";
import { checkTransitions } from "./rules/transitions.js";
import { checkUsecases } from "./rules/usecases.js";
import { checkSpecs } from "./rules/specs.js";
import { checkJourneys } from "./rules/journeys.js";
import { checkUI } from "./rules/ui.js";
import { checkReactions } from "./rules/reactions.js";
import { checkUnused } from "./rules/unused.js";

export type Severity = "error" | "warning";

export type ValidationIssue = {
  severity: Severity;
  rule: string;
  message: string;
  path: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type ValidationRule = (spec: WebAppSpec) => ValidationIssue[];

const allRules: ValidationRule[] = [
  checkUniqueness,
  checkReferences,
  checkTransitions,
  checkUsecases,
  checkSpecs,
  checkJourneys,
  checkUI,
  checkReactions,
  checkUnused,
];

export function validate(spec: WebAppSpec): ValidationResult {
  const issues = allRules.flatMap((rule) => rule(spec));
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
