import type { WebAppSpec } from "@webapp-spec/types";
import type { ValidationIssue } from "../validator.js";

export function checkUI(spec: WebAppSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const componentMap = new Map(spec.ui.components.map((c) => [c.id, c]));
  const usecaseMap = new Map(spec.usecases.map((u) => [u.id, u]));

  // Component internal consistency
  for (let i = 0; i < spec.ui.components.length; i++) {
    const comp = spec.ui.components[i];
    const sourceFieldNames = comp.sources.flatMap((s) => s.fields);
    const inputFieldNames = comp.inputs.map((f) => f.name);
    const availableFields = new Set([...sourceFieldNames, ...inputFieldNames]);

    for (let j = 0; j < comp.transforms.length; j++) {
      const tr = comp.transforms[j];
      for (const fromField of tr.from) {
        if (!availableFields.has(fromField)) {
          issues.push({
            severity: "error",
            rule: "ui.transform-input",
            message: `Component "${comp.id}" transform from "${fromField}" is not available in sources/inputs`,
            path: `ui.components[${i}].transforms[${j}]`,
          });
        }
      }
      // transform output becomes available for subsequent transforms
      availableFields.add(tr.to);

      const allOutputNames = new Set([
        ...comp.displays.map((d) => d.name),
        ...comp.outputs.map((o) => o.name),
      ]);
      if (!allOutputNames.has(tr.to)) {
        issues.push({
          severity: "error",
          rule: "ui.transform-output",
          message: `Component "${comp.id}" transform to "${tr.to}" is not defined in displays/outputs`,
          path: `ui.components[${i}].transforms[${j}]`,
        });
      }
    }
  }

  // View action validation
  for (let i = 0; i < spec.ui.views.length; i++) {
    const view = spec.ui.views[i];
    const viewComponentIds = new Set(view.components);

    for (let j = 0; j < view.actions.length; j++) {
      const action = view.actions[j];
      const uc = usecaseMap.get(action.usecase);

      for (const [ucInput, source] of Object.entries(action.inputFrom)) {
        // Validate "componentId.outputName" format
        const dotIdx = source.indexOf(".");
        if (dotIdx === -1) {
          issues.push({
            severity: "error",
            rule: "view.input-mapping",
            message: `View "${view.id}" inputFrom value "${source}" must be in "componentId.outputName" format`,
            path: `ui.views[${i}].actions[${j}].inputFrom`,
          });
          continue;
        }

        const compId = source.substring(0, dotIdx);
        const outputName = source.substring(dotIdx + 1);

        if (!viewComponentIds.has(compId)) {
          issues.push({
            severity: "error",
            rule: "view.input-mapping",
            message: `View "${view.id}" inputFrom references component "${compId}" which is not in this View`,
            path: `ui.views[${i}].actions[${j}].inputFrom`,
          });
          continue;
        }

        const comp = componentMap.get(compId);
        if (comp) {
          const outputNames = new Set(comp.outputs.map((o) => o.name));
          if (!outputNames.has(outputName)) {
            issues.push({
              severity: "error",
              rule: "view.input-mapping",
              message: `View "${view.id}" inputFrom references undefined output "${outputName}" on Component "${compId}"`,
              path: `ui.views[${i}].actions[${j}].inputFrom`,
            });
          }
        }

        // Check usecase input field exists
        if (uc && !(ucInput in uc.input)) {
          issues.push({
            severity: "error",
            rule: "view.usecase-input",
            message: `View "${view.id}" inputFrom key "${ucInput}" is not defined in Usecase "${action.usecase}" input`,
            path: `ui.views[${i}].actions[${j}].inputFrom`,
          });
        }
      }

      // Check all usecase inputs are mapped
      if (uc) {
        for (const inputKey of Object.keys(uc.input)) {
          if (uc.input[inputKey].startsWith("actor.")) continue;
          if (!(inputKey in action.inputFrom)) {
            issues.push({
              severity: "error",
              rule: "view.usecase-input",
              message: `View "${view.id}" does not map Usecase "${action.usecase}" input "${inputKey}"`,
              path: `ui.views[${i}].actions[${j}]`,
            });
          }
        }
      }
    }
  }

  return issues;
}
