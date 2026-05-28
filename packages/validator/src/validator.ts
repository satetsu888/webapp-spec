import type { WebAppSpec } from "@webapp-spec/types";
import { compareSemver } from "./semver.js";
import { checkReferences } from "./rules/references.js";
import { checkUniqueness } from "./rules/uniqueness.js";
import { checkTransitions } from "./rules/transitions.js";
import { checkUsecases } from "./rules/usecases.js";
import { checkSpecs } from "./rules/specs.js";
import { checkScenarios } from "./rules/scenarios.js";
import { checkUI } from "./rules/ui.js";
import { checkReactions } from "./rules/reactions.js";
import { checkUnused } from "./rules/unused.js";
import { checkEntities } from "./rules/entities.js";
import { checkActors } from "./rules/actors.js";
import { checkFixtures } from "./rules/fixtures.js";

export const SUPPORTED_SPEC_VERSION = "0.1.0";

export type Severity = "error" | "warning" | "info";

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
  infos: ValidationIssue[];
};

export type VersionedRule = {
  fn: (spec: WebAppSpec) => ValidationIssue[];
  minVersion: string;
  maxVersion?: string;
};

const allRules: VersionedRule[] = [
  { fn: checkUniqueness, minVersion: "0.1.0" },
  { fn: checkReferences, minVersion: "0.1.0" },
  { fn: checkTransitions, minVersion: "0.1.0" },
  { fn: checkUsecases, minVersion: "0.1.0" },
  { fn: checkSpecs, minVersion: "0.1.0" },
  { fn: checkScenarios, minVersion: "0.1.0" },
  { fn: checkUI, minVersion: "0.1.0" },
  { fn: checkReactions, minVersion: "0.1.0" },
  { fn: checkUnused, minVersion: "0.1.0" },
  { fn: checkEntities, minVersion: "0.1.0" },
  { fn: checkActors, minVersion: "0.1.0" },
  { fn: checkFixtures, minVersion: "0.1.0" },
];

export function validate(spec: WebAppSpec): ValidationResult {
  if (compareSemver(spec.webappSpec, SUPPORTED_SPEC_VERSION) > 0) {
    const error: ValidationIssue = {
      severity: "error",
      rule: "version.unsupported",
      message: `webappSpec version "${spec.webappSpec}" is not supported (latest supported: "${SUPPORTED_SPEC_VERSION}")`,
      path: "webappSpec",
    };
    return { valid: false, errors: [error], warnings: [], infos: [] };
  }

  const applicableRules = allRules.filter((r) => {
    if (compareSemver(spec.webappSpec, r.minVersion) < 0) return false;
    if (r.maxVersion && compareSemver(spec.webappSpec, r.maxVersion) > 0) return false;
    return true;
  });

  const issues = applicableRules.flatMap((r) => r.fn(spec));
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}
