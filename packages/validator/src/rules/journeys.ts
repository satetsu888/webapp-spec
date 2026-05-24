import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkJourneys(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const usecaseMap = new Map(spec.usecases.map((u) => [u.id, u]));
  const journeyMap = new Map(spec.journeys.map((j) => [j.id, j]));

  for (let i = 0; i < spec.journeys.length; i++) {
    const journey = spec.journeys[i];

    for (let k = 0; k < journey.steps.length; k++) {
      const step = journey.steps[k];

      if (typeof step === "string") {
        // JourneyRef: check actor match
        const refJourney = journeyMap.get(step);
        if (refJourney && refJourney.actor !== journey.actor) {
          issues.push({
            severity: "warning",
            rule: "journey.actor-mismatch",
            message: `Journey "${journey.id}" (actor: ${journey.actor}) が参照する journey "${step}" の actor "${refJourney.actor}" と一致しません`,
            path: `journeys[${i}].steps[${k}]`,
          });
        }
      } else {
        // UsecaseStep: check actor match
        const uc = usecaseMap.get(step.usecase);
        if (uc && uc.actor !== journey.actor) {
          issues.push({
            severity: "warning",
            rule: "journey.actor-mismatch",
            message: `Journey "${journey.id}" (actor: ${journey.actor}) のステップで usecase "${step.usecase}" (actor: ${uc.actor}) を呼んでいます`,
            path: `journeys[${i}].steps[${k}]`,
          });
        }
      }
    }

    // Check variants recursively
    if (journey.variants) {
      for (let v = 0; v < journey.variants.length; v++) {
        const variant = journey.variants[v];
        if (variant.actor !== journey.actor) {
          issues.push({
            severity: "warning",
            rule: "journey.actor-mismatch",
            message: `Journey "${journey.id}" の variant "${variant.id}" の actor "${variant.actor}" が親と一致しません`,
            path: `journeys[${i}].variants[${v}]`,
          });
        }
      }
    }
  }

  return issues;
}
