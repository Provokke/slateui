// Copies the built registry (registry/dist) into the CLI's dist so the published
// package works offline with no --registry flag.
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "../../../registry/dist");
const target = path.resolve(here, "../dist/registry");
if (!existsSync(path.join(source, "index.json"))) {
  console.error(
    "registry/dist/index.json not found - run `pnpm --filter @slateui/registry build` first",
  );
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log("bundled registry into", path.relative(process.cwd(), target));
