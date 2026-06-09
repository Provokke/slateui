import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CLI = path.join(ROOT, "packages/cli/dist/index.js");
export const REGISTRY = path.join(ROOT, "registry/dist");
export const SHOWCASE = path.join(ROOT, "e2e/fixtures/Showcase.tsx");

/** Environment without pnpm/npm config leaking from the monorepo's own `pnpm test`. */
export function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(npm_|PNPM_|pnpm_)/i.test(key) || key === "INIT_CWD" || key === "NODE_OPTIONS") continue;
    env[key] = value;
  }
  env.NEXT_TELEMETRY_DISABLED = "1";
  env.CI = "1";
  env.SLATEUI_QUIET_INSTALL = "1";
  return env;
}

const execFileAsync = promisify(execFile);

/** Run a command asynchronously (keeps the vitest worker responsive during long builds). */
export async function sh(cmd: string, args: string[], cwd: string): Promise<string> {
  const started = Date.now();
  process.stdout.write(`[e2e] $ ${cmd} ${args.join(" ")}  (in ${path.basename(cwd)})\n`);
  try {
    const { stdout: out } = await execFileAsync(cmd, args, {
      cwd,
      env: cleanEnv(),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    process.stdout.write(`[e2e]   ok in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
    return out;
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; code?: number };
    throw new Error(
      `${cmd} ${args.join(" ")} failed (exit ${e.code}) in ${cwd}\n--- stdout ---\n${e.stdout?.slice(-6000)}\n--- stderr ---\n${e.stderr?.slice(-6000)}`,
    );
  }
}

export function slateui(args: string[], cwd: string): Promise<string> {
  return sh(process.execPath, [CLI, ...args], cwd);
}

export function workdir(): string {
  const base = path.join(os.tmpdir(), "slateui-e2e");
  mkdirSync(base, { recursive: true });
  return mkdtempSync(path.join(base, "run-"));
}

export const read = (...p: string[]) => readFileSync(path.join(...p), "utf8");
export const write = (file: string, content: string) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};

export const ALL_UI = [
  "accordion",
  "alert",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "dialog",
  "dropdown-menu",
  "form",
  "input",
  "label",
  "popover",
  "select",
  "separator",
  "skeleton",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "tooltip",
];
