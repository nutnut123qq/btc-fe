import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "contracts/openapi.json");
const outputPath = resolve(root, "src/lib/generated/api-contract.d.ts");
const check = process.argv.includes("--check");

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const ast = await openapiTS(schema, { alphabetize: true });
const generated = `// Generated from contracts/openapi.json. Do not edit.\n${astToString(ast)}`.replace(/\r\n/g, "\n");

if (check) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current.replace(/\r\n/g, "\n") !== generated) {
    throw new Error("Pinned OpenAPI TypeScript types are stale. Run npm run contract:generate.");
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generated, "utf8");
  console.log(`Generated ${pathToFileURL(outputPath).pathname}`);
}
