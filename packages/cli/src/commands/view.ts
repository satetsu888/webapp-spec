import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { Command } from "commander";
import { createSpecServer, findAvailablePort } from "../lib/static-server.js";
import { openBrowser } from "../lib/open-browser.js";

function resolveViewerDistPath(): string {
  const require = createRequire(import.meta.url);
  const viewerPkgPath = require.resolve("@webapp-spec/viewer/package.json");
  return path.join(path.dirname(viewerPkgPath), "dist");
}

export function registerViewCommand(program: Command): void {
  program
    .command("view")
    .description("Open a WebAppSpec file in the browser viewer")
    .argument("<file>", "Path to the spec JSON file")
    .option("-p, --port <port>", "Port number", "3000")
    .option("--no-open", "Do not open browser automatically")
    .action(async (file: string, opts: { port: string; open: boolean }) => {
      let raw: string;
      try {
        raw = readFileSync(file, "utf-8");
      } catch {
        console.error(`Error: cannot read file "${file}"`);
        process.exit(1);
      }

      let specData: unknown;
      try {
        specData = JSON.parse(raw);
      } catch {
        console.error(`Error: "${file}" is not valid JSON`);
        process.exit(1);
      }

      const viewerDistPath = resolveViewerDistPath();

      const preferredPort = parseInt(opts.port, 10);
      const port = await findAvailablePort(preferredPort);

      const server = createSpecServer({ specData, viewerDistPath, port });
      server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`Serving viewer at ${url}`);
        console.log(`Spec: ${path.resolve(file)}`);
        console.log("Press Ctrl+C to stop.");

        if (opts.open) {
          openBrowser(url);
        }
      });
    });
}
