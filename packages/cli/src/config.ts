import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CliError } from "./logger.js";
import type { Framework, TsPaths } from "./detect.js";

export const CONFIG_FILE = "slateui.json";

export interface Aliases {
  components: string;
  ui: string;
  lib: string;
  utils: string;
  hooks: string;
}

export interface SlateConfig {
  /** "bundled" (registry shipped with the CLI), a local path, or an http(s) URL. */
  registry: string;
  framework: Framework;
  tsx: boolean;
  /** Keep "use client" directives (React Server Components). */
  rsc: boolean;
  tailwind: { css: string; version: 3 | 4 | null };
  aliases: Aliases;
}

export function defaultAliases(prefix: string): Aliases {
  return {
    components: `${prefix}/components`,
    ui: `${prefix}/components/ui`,
    lib: `${prefix}/lib`,
    utils: `${prefix}/lib/utils`,
    hooks: `${prefix}/hooks`,
  };
}

export function readConfig(cwd: string): SlateConfig | null {
  const file = path.join(cwd, CONFIG_FILE);
  if (!existsSync(file)) return null;
  let raw: Partial<SlateConfig>;
  try {
    raw = JSON.parse(readFileSync(file, "utf8")) as Partial<SlateConfig>;
  } catch (error) {
    throw new CliError(`Could not parse ${CONFIG_FILE}: ${(error as Error).message}`);
  }
  if (!raw.aliases || !raw.aliases.ui || !raw.aliases.utils) {
    throw new CliError(`${CONFIG_FILE} is missing "aliases.ui" / "aliases.utils".`);
  }
  const prefix = raw.aliases.ui.split("/")[0];
  return {
    registry: raw.registry ?? "bundled",
    framework: raw.framework ?? "other",
    tsx: raw.tsx ?? true,
    rsc: raw.rsc ?? false,
    tailwind: { css: raw.tailwind?.css ?? "src/index.css", version: raw.tailwind?.version ?? 4 },
    aliases: { ...defaultAliases(prefix), ...raw.aliases },
  };
}

export function writeConfig(cwd: string, config: SlateConfig) {
  writeFileSync(path.join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n");
}

/**
 * Map an import alias (e.g. "@/components/ui") to a directory on disk using the
 * project's tsconfig paths. Falls back to "<prefix>/" -> "./src/" (or root) when
 * no mapping matches.
 */
export function resolveAliasPath(cwd: string, alias: string, tsPaths: TsPaths | null): string {
  if (tsPaths) {
    // Longest pattern first so "@/components/*" beats "@/*".
    const patterns = Object.keys(tsPaths.paths).sort((a, b) => b.length - a.length);
    for (const pattern of patterns) {
      const targets = tsPaths.paths[pattern];
      if (!targets?.length) continue;
      if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -1); // keep trailing slash
        if (alias.startsWith(prefix) || `${alias}/` === prefix) {
          const rest = alias.slice(prefix.length);
          return path.resolve(tsPaths.baseDir, targets[0].replace("*", rest));
        }
      } else if (pattern === alias) {
        return path.resolve(tsPaths.baseDir, targets[0]);
      }
    }
  }
  const [prefix, ...rest] = alias.split("/");
  if (prefix.startsWith("@") || prefix === "~" || prefix === "#") {
    const base = existsSync(path.join(cwd, "src")) ? path.join(cwd, "src") : cwd;
    return path.join(base, ...rest);
  }
  return path.resolve(cwd, alias);
}
