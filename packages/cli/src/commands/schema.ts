import { readFileSync } from "node:fs";
import type { Command } from "commander";

export function registerSchemaCommand(program: Command): void {
  program
    .command("schema")
    .description("Output the WebAppSpec JSON Schema to stdout")
    .action(() => {
      const schemaPath = new URL(
        "../../../../schema/webapp-spec.schema.json",
        import.meta.url,
      );
      const schema = readFileSync(schemaPath, "utf-8");
      process.stdout.write(schema);
    });
}
