import type { WebAppSpec, ViewStep, BackgroundStep } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

function isViewStep(step: unknown): step is ViewStep {
  return typeof step === "object" && step !== null && "view" in step;
}

function isBackgroundStep(step: unknown): step is BackgroundStep {
  return typeof step === "object" && step !== null && "operation" in step;
}

export function checkScenarios(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const operationMap = new Map(spec.usecases.operations.map((u) => [u.id, u]));
  const scenarioMap = new Map(spec.scenarios.map((s) => [s.id, s]));
  const viewMap = new Map(spec.ui.views.map((v) => [v.id, v]));

  for (let i = 0; i < spec.scenarios.length; i++) {
    const scenario = spec.scenarios[i];

    for (let k = 0; k < scenario.steps.length; k++) {
      const step = scenario.steps[k];

      if (typeof step === "string") {
        const refScenario = scenarioMap.get(step);
        if (refScenario && refScenario.actor !== scenario.actor) {
          issues.push({
            severity: "warning",
            rule: "scenario.actor-mismatch",
            message: `Scenario "${scenario.id}" (actor: ${scenario.actor}) references scenario "${step}" with different actor "${refScenario.actor}"`,
            path: `scenarios[${i}].steps[${k}]`,
          });
        }
      } else if (isViewStep(step)) {
        if (step.action) {
          const uc = operationMap.get(step.action);
          if (uc && uc.actor !== scenario.actor) {
            issues.push({
              severity: "warning",
              rule: "scenario.actor-mismatch",
              message: `Scenario "${scenario.id}" (actor: ${scenario.actor}) step action "${step.action}" has different actor "${uc.actor}"`,
              path: `scenarios[${i}].steps[${k}]`,
            });
          }

          const view = viewMap.get(step.view);
          if (view && !view.actions.some((a) => a.operation === step.action)) {
            issues.push({
              severity: "error",
              rule: "scenario.view-action-mismatch",
              message: `Scenario "${scenario.id}" step action "${step.action}" is not defined in view "${step.view}" actions`,
              path: `scenarios[${i}].steps[${k}]`,
            });
          }
        }
      }
      // BackgroundStep: actor is explicitly different, no mismatch check
    }

    if (scenario.variants) {
      for (let v = 0; v < scenario.variants.length; v++) {
        const variant = scenario.variants[v];
        if (variant.actor !== scenario.actor) {
          issues.push({
            severity: "warning",
            rule: "scenario.actor-mismatch",
            message: `Scenario "${scenario.id}" variant "${variant.id}" has different actor "${variant.actor}" than parent`,
            path: `scenarios[${i}].variants[${v}]`,
          });
        }
      }
    }
  }

  return issues;
}
