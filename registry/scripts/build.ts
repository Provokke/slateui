/**
 * Builds the registry into JSON consumed by the slateui CLI:
 *   dist/index.json      - catalogue (metadata only) + theme CSS
 *   dist/r/<name>.json   - full item including file contents
 * Run with: node scripts/build.ts (Node >= 22.18 strips TypeScript types natively).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildItem, loadItems, validateItems } from "./registry-lib.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const items = loadItems(root);
const problems = validateItems(root, items);
if (problems.length > 0) {
  console.error("Registry validation failed:\n  " + problems.join("\n  "));
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(path.join(out, "r"), { recursive: true });

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
  version: string;
};
const built = items.map((item) => buildItem(root, item));
for (const item of built) {
  writeFileSync(path.join(out, "r", `${item.name}.json`), JSON.stringify(item, null, 2) + "\n");
}

const index = {
  name: "slateui",
  version: pkg.version,
  theme: { css: readFileSync(path.join(root, "styles/theme.css"), "utf8") },
  items: built.map(({ files, ...meta }) => ({ ...meta, files: files.map((f) => f.path) })),
};
writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(
  `slateui registry: built ${built.length} items -> ${path.relative(process.cwd(), out)}`,
);
