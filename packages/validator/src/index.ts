#!/usr/bin/env node

import { readFileSync } from "node:fs";
import _Ajv from "ajv/dist/2020.js";
const Ajv = _Ajv as unknown as typeof _Ajv.default;
import { validate } from "./validator.js";
import type { WebAppSpec } from "@webapp-spec/types";

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "--help") {
  console.log("Usage: webapp-spec-validate <spec.json>");
  process.exit(0);
}

const filePath = args[0];
let raw: string | undefined;
try {
  raw = readFileSync(filePath, "utf-8");
} catch {
  console.error(`Error: ファイル "${filePath}" を読み込めません`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw!);
} catch {
  console.error(`Error: "${filePath}" は有効な JSON ではありません`);
  process.exit(1);
}

// JSON Schema validation
const schemaPath = new URL("../../../schema/webapp-spec.schema.json", import.meta.url);
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

// Semantic validation
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

if (result.valid) {
  console.log(result.warnings.length > 0 ? "\nValidation passed (with warnings)." : "Validation passed.");
  process.exit(0);
} else {
  console.error("\nValidation failed.");
  process.exit(1);
}
