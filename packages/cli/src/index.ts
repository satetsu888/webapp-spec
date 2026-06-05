#!/usr/bin/env node

import { Command } from "commander";
import { registerValidateCommand } from "./commands/validate.js";
import { registerViewCommand } from "./commands/view.js";
import { registerSchemaCommand } from "./commands/schema.js";

const program = new Command();

program
  .name("wspec")
  .description("WebAppSpec CLI")
  .version("0.0.1");

registerValidateCommand(program);
registerViewCommand(program);
registerSchemaCommand(program);

program.parse();
