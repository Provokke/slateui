import { spawnSync } from "node:child_process";
import type { PackageManager } from "./detect.js";
import { CliError, logger } from "./logger.js";

export function installCommand(pm: PackageManager, packages: string[]): [string, string[]] {
  switch (pm) {
    case "npm":
      return ["npm", ["install", ...packages]];
    case "pnpm":
      return ["pnpm", ["add", ...packages]];
    case "yarn":
      return ["yarn", ["add", ...packages]];
    case "bun":
      return ["bun", ["add", ...packages]];
  }
}

/** Strip a version range: "@radix-ui/react-slot@^1.2.3" -> "@radix-ui/react-slot". */
export function bareName(spec: string): string {
  const at = spec.lastIndexOf("@");
  return at > 0 ? spec.slice(0, at) : spec;
}

export function missingPackages(specs: string[], installed: Record<string, string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const spec of specs) {
    const name = bareName(spec);
    if (installed[name] || seen.has(name)) continue;
    seen.add(name);
    out.push(spec);
  }
  return out;
}

export function installPackages(cwd: string, pm: PackageManager, packages: string[]) {
  if (packages.length === 0) return;
  const [cmd, args] = installCommand(pm, packages);
  logger.step(`${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: process.env.SLATEUI_QUIET_INSTALL ? "pipe" : "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    const output = result.stderr ? result.stderr.toString() : "";
    throw new CliError(
      `Dependency install failed (${cmd} exited with ${result.status}).\n${output}`,
    );
  }
}
