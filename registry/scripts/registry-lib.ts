import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export interface ItemMeta {
  name: string;
  type: "ui" | "lib" | "hook";
  description?: string;
  files: string[];
  dependencies: string[];
  registryDependencies: string[];
}

export interface BuiltFile {
  path: string;
  content: string;
}

export interface BuiltItem extends Omit<ItemMeta, "files"> {
  files: BuiltFile[];
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g;

export function importSpecifiers(source: string): string[] {
  const out = new Set<string>();
  for (const match of source.matchAll(IMPORT_RE)) out.add(match[1] ?? match[2]);
  return [...out];
}

/** Turn "@radix-ui/react-slot/foo" into "@radix-ui/react-slot", "clsx/x" into "clsx". */
export function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

export function loadItems(root: string): ItemMeta[] {
  const dir = path.join(root, "items");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as ItemMeta & {
        $schema?: string;
      };
      const { $schema: _schema, ...meta } = raw;
      return meta;
    });
}

const PEERS = new Set(["react", "react-dom"]);

/** Validate metadata against the actual source. Returns a list of human readable problems. */
export function validateItems(root: string, items: ItemMeta[]): string[] {
  const problems: string[] = [];
  const names = new Set(items.map((i) => i.name));
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
  };
  for (const item of items) {
    if (!/^[a-z][a-z0-9-]*$/.test(item.name)) {
      problems.push(`${item.name}: invalid name`);
    }
    for (const dep of item.registryDependencies) {
      if (!names.has(dep)) problems.push(`${item.name}: unknown registryDependency "${dep}"`);
    }
    for (const dep of item.dependencies) {
      if (!pkg.dependencies[dep]) problems.push(`${item.name}: "${dep}" missing from package.json`);
    }
    for (const file of item.files) {
      let source: string;
      try {
        source = readFileSync(path.join(root, file), "utf8");
      } catch {
        problems.push(`${item.name}: file not found ${file}`);
        continue;
      }
      for (const spec of importSpecifiers(source)) {
        if (spec.startsWith("@/")) {
          const ui = /^@\/components\/ui\/(.+)$/.exec(spec);
          const needed = ui ? ui[1] : spec === "@/lib/utils" ? "utils" : null;
          if (!needed) problems.push(`${item.name}: unsupported alias import "${spec}"`);
          else if (!item.registryDependencies.includes(needed)) {
            problems.push(
              `${item.name}: imports "${spec}" but "${needed}" not in registryDependencies`,
            );
          }
        } else if (spec.startsWith(".")) {
          problems.push(`${item.name}: relative import "${spec}" is not portable`);
        } else {
          const name = packageName(spec);
          if (!PEERS.has(name) && !item.dependencies.includes(name)) {
            problems.push(`${item.name}: imports "${name}" but it is not in dependencies`);
          }
        }
      }
    }
  }
  return problems;
}

export function buildItem(root: string, item: ItemMeta): BuiltItem {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
  };
  return {
    ...item,
    // Pin to the range we test against so consumers get a known-good version.
    dependencies: item.dependencies.map(
      (d) => `${d}@^${pkg.dependencies[d].replace(/^[\^~]/, "")}`,
    ),
    files: item.files.map((file) => ({
      path: file,
      content: readFileSync(path.join(root, file), "utf8"),
    })),
  };
}
