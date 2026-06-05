import { readFileSync } from "node:fs";
import type { Command } from "commander";
import _Ajv from "ajv/dist/2020.js";
const Ajv = _Ajv as unknown as typeof _Ajv.default;
import { validate } from "@webapp-spec/validator";
import type { WebAppSpec } from "@webapp-spec/types";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate a WebAppSpec JSON file")
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

      const schemaPath = new URL(
        "../../../../schema/webapp-spec.schema.json",
        import.meta.url,
      );
      const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
      const ajv = new Ajv({ allErrors: true });
      const schemaValid = ajv.validate(schema, data);

      if (!schemaValid) {
        console.error("Schema validation failed:");
        for (const err of ajv.errors ?? []) {
          console.error(`  ${err.instancePath || "/"}: ${err.message}`);
        }
        process.exit(1);
      }

      const result = validate(data as WebAppSpec);

      if (result.errors.length > 0) {
        console.error(`\n${result.errors.length} error(s):`);
        for (const err of result.errors) {
          console.error(`  [${err.rule}] ${err.message}`);
          console.error(`    at ${err.path}`);
        }
      }

      if (result.warnings.length > 0) {
        console.warn(`\n${result.warnings.length} warning(s):`);
        for (const warn of result.warnings) {
          console.warn(`  [${warn.rule}] ${warn.message}`);
          console.warn(`    at ${warn.path}`);
        }
      }

      if (result.infos.length > 0) {
        console.log(`\n${result.infos.length} info(s):`);
        for (const info of result.infos) {
          console.log(`  [${info.rule}] ${info.message}`);
          console.log(`    at ${info.path}`);
        }
      }

      if (result.valid) {
        const hasDiag =
          result.warnings.length > 0 || result.infos.length > 0;
        console.log(
          hasDiag
            ? "\nValidation passed (with diagnostics)."
            : "Validation passed.",
        );
        process.exit(0);
      } else {
        console.error("\nValidation failed.");
        process.exit(1);
      }
    });
}
