import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseJsonc } from "./jsonc.js";

export type Framework = "next-app" | "next-pages" | "vite" | "other";
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface TsPaths {
  /** Directory that path mappings are relative to (baseUrl or the config's directory). */
  baseDir: string;
  paths: Record<string, string[]>;
  /** The config file the paths came from. */
  file: string;
}

export interface ProjectInfo {
  cwd: string;
  framework: Framework;
  typescript: boolean;
  srcDir: boolean;
  tsPaths: TsPaths | null;
  /** Import alias prefix such as "@" or "~", derived from tsconfig paths. */
  aliasPrefix: string | null;
  tailwind: { version: 3 | 4 | null; css: string | null; config: string | null };
  packageManager: PackageManager;
  dependencies: Record<string, string>;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

export function readPackageJson(cwd: string): PackageJson | null {
  const file = path.join(cwd, "package.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as PackageJson;
}

const exists = (cwd: string, ...rel: string[]) => existsSync(path.join(cwd, ...rel));

export function detectFramework(cwd: string, deps: Record<string, string>): Framework {
  if (deps.next) {
    if (exists(cwd, "src/app") || exists(cwd, "app")) return "next-app";
    return "next-pages";
  }
  if (deps.vite || ["ts", "js", "mts", "mjs"].some((ext) => exists(cwd, `vite.config.${ext}`))) {
    return "vite";
  }
  return "other";
}

export function detectPackageManager(cwd: string, pkg?: PackageJson | null): PackageManager {
  let dir = path.resolve(cwd);
  for (;;) {
    if (existsSync(path.join(dir, "bun.lock")) || existsSync(path.join(dir, "bun.lockb"))) {
      return "bun";
    }
    if (existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(path.join(dir, "yarn.lock"))) return "yarn";
    if (existsSync(path.join(dir, "package-lock.json"))) return "npm";
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const field = pkg?.packageManager?.split("@")[0];
  if (field === "pnpm" || field === "yarn" || field === "bun" || field === "npm") return field;
  const agent = process.env.npm_config_user_agent?.split("/")[0];
  if (agent === "pnpm" || agent === "yarn" || agent === "bun") return agent;
  return "npm";
}

interface TsConfigShape {
  compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
  references?: { path: string }[];
}

function readTsConfig(file: string): TsConfigShape | null {
  if (!existsSync(file)) return null;
  try {
    return parseJsonc<TsConfigShape>(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Find compilerOptions.paths. Looks at tsconfig.json / jsconfig.json first, then
 * follows project references (Vite's template keeps paths in tsconfig.app.json).
 */
export function findTsPaths(cwd: string): TsPaths | null {
  const candidates = ["tsconfig.json", "jsconfig.json"];
  const queue = candidates.map((c) => path.join(cwd, c));
  const seen = new Set<string>();
  queue.push(path.join(cwd, "tsconfig.app.json"));
  while (queue.length) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const config = readTsConfig(file);
    if (!config) continue;
    const paths = config.compilerOptions?.paths;
    if (paths && Object.keys(paths).length > 0) {
      return {
        baseDir: path.resolve(path.dirname(file), config.compilerOptions?.baseUrl ?? "."),
        paths,
        file,
      };
    }
    for (const ref of config.references ?? []) {
      let target = path.resolve(path.dirname(file), ref.path);
      if (!target.endsWith(".json")) target = path.join(target, "tsconfig.json");
      queue.push(target);
    }
  }
  return null;
}

/** "@/*" -> "@", "~/*" -> "~". Prefers a mapping that points at ./src or the root. */
export function aliasPrefixFrom(tsPaths: TsPaths | null): string | null {
  if (!tsPaths) return null;
  const keys = Object.keys(tsPaths.paths).filter((k) => k.endsWith("/*"));
  if (keys.length === 0) return null;
  const preferred =
    keys.find((k) => tsPaths.paths[k].some((t) => /^(\.\/)?(src\/)?\*$/.test(t))) ?? keys[0];
  return preferred.slice(0, -2);
}

const CSS_CANDIDATES = [
  "src/app/globals.css",
  "app/globals.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/index.css",
  "src/main.css",
  "src/App.css",
  "src/global.css",
];

export function detectCssFile(cwd: string, framework: Framework): string | null {
  for (const candidate of CSS_CANDIDATES) {
    if (exists(cwd, candidate)) {
      // App.css in Vite is component-scoped by convention; only use it as a last resort.
      if (candidate === "src/App.css" && exists(cwd, "src/index.css")) continue;
      return candidate;
    }
  }
  if (framework === "next-app")
    return exists(cwd, "src") ? "src/app/globals.css" : "app/globals.css";
  if (framework === "vite") return "src/index.css";
  return null;
}

export function detectTailwindVersion(deps: Record<string, string>): 3 | 4 | null {
  const range = deps.tailwindcss;
  if (!range) return null;
  const major = /(\d+)/.exec(range)?.[1];
  if (major === "3") return 3;
  if (major === "4" || range === "latest") return 4;
  return null;
}

export function detectProject(cwd: string): ProjectInfo | null {
  const pkg = readPackageJson(cwd);
  if (!pkg) return null;
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  const framework = detectFramework(cwd, dependencies);
  const tsPaths = findTsPaths(cwd);
  const tailwindConfig =
    ["ts", "js", "cjs", "mjs"].map((e) => `tailwind.config.${e}`).find((f) => exists(cwd, f)) ??
    null;
  return {
    cwd,
    framework,
    typescript: exists(cwd, "tsconfig.json"),
    srcDir: exists(cwd, "src"),
    tsPaths,
    aliasPrefix: aliasPrefixFrom(tsPaths),
    tailwind: {
      version: detectTailwindVersion(dependencies),
      css: detectCssFile(cwd, framework),
      config: tailwindConfig,
    },
    packageManager: detectPackageManager(cwd, pkg),
    dependencies,
  };
}
