import { readFileSync } from "node:fs";
import type { Command } from "commander";
import type { WebAppSpec } from "@webapp-spec/types";

function printSection(title: string, lines: string[]): void {
  console.log(`\n  ${title}`);
  for (const line of lines) {
    console.log(`    ${line}`);
  }
}

function summarizeSpec(spec: WebAppSpec): void {
  console.log(`\n${spec.name} (v${spec.version})`);
  console.log(`webappSpec: ${spec.webappSpec}`);

  const entities = spec.domain.entities ?? [];
  const totalFields = entities.reduce(
    (sum, e) => sum + (e.fields?.length ?? 0),
    0,
  );
  const totalStates = entities.reduce(
    (sum, e) => sum + (e.states?.length ?? 0),
    0,
  );
  const totalTraits = entities.reduce(
    (sum, e) => sum + (e.traits?.length ?? 0),
    0,
  );
  const relations = spec.domain.relations ?? [];
  const transitions = spec.domain.transitions ?? [];

  printSection("Domain", [
    `Entities:      ${entities.length} (${totalFields} fields, ${totalStates} states, ${totalTraits} traits)`,
    `Relations:     ${relations.length}`,
    `Transitions:   ${transitions.length}`,
  ]);

  const actors = spec.usecases.actors ?? [];
  const operations = spec.usecases.operations ?? [];
  const sideEffects = spec.usecases.sideEffects ?? [];
  const withFollowUps = operations.filter(
    (op) => op.followUps && op.followUps.length > 0,
  ).length;

  printSection("Usecases", [
    `Actors:        ${actors.length}`,
    `Operations:    ${operations.length}${withFollowUps > 0 ? ` (${withFollowUps} with followUps)` : ""}`,
    `Side Effects:  ${sideEffects.length}`,
  ]);

  const specs = spec.specs ?? [];
  const totalRules = specs.reduce(
    (sum, s) => sum + (s.rules?.length ?? 0),
    0,
  );

  printSection("Specs", [`Specs:         ${specs.length} (${totalRules} rules)`]);

  const scenarios = spec.scenarios ?? [];
  const withVariants = scenarios.filter(
    (s) => s.variants && s.variants.length > 0,
  ).length;

  printSection("Scenarios", [
    `Scenarios:     ${scenarios.length}${withVariants > 0 ? ` (${withVariants} with variants)` : ""}`,
  ]);

  const components = spec.ui?.components ?? [];
  const views = spec.ui?.views ?? [];

  printSection("UI", [
    `Components:    ${components.length}`,
    `Views:         ${views.length}`,
  ]);

  const fixtures = spec.fixtures ?? [];
  const totalInstances = fixtures.reduce(
    (sum, f) => sum + (f.instances?.length ?? 0),
    0,
  );

  if (fixtures.length > 0) {
    printSection("Fixtures", [
      `Fixtures:      ${fixtures.length} (${totalInstances} instances)`,
    ]);
  }

  console.log();
}

export function registerInfoCommand(program: Command): void {
  program
    .command("info")
    .description("Print summary information about a WebAppSpec file")
    .argument("<file>", "Path to the spec JSON file")
    .action((file: string) => {
      let raw: string;
      try {
        raw = readFileSync(file, "utf-8");
      } catch {
        console.error(`Error: cannot read file "${file}"`);
        process.exit(1);
      }

      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error(`Error: "${file}" is not valid JSON`);
        process.exit(1);
      }

      const spec = data as WebAppSpec;
      if (!spec.domain || !spec.usecases) {
        console.error("Error: not a valid WebAppSpec file");
        process.exit(1);
      }

      summarizeSpec(spec);
    });
}
