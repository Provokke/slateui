import path from "node:path";
import { readConfig, resolveAliasPath, type SlateConfig } from "./config.js";
import { detectProject, type ProjectInfo } from "./detect.js";
import { CliError } from "./logger.js";
import type { RegistryItem } from "./registry.js";
import { transformFile } from "./transform.js";

export interface Context {
  cwd: string;
  config: SlateConfig;
  project: ProjectInfo;
}

export function loadContext(cwd: string): Context {
  const config = readConfig(cwd);
  if (!config) {
    throw new CliError("No slateui.json found. Run `slateui init` first.");
  }
  const project = detectProject(cwd);
  if (!project) throw new CliError(`No package.json found in ${cwd}`);
  return { cwd, config, project };
}

/** Absolute path where a registry file should be written in this project. */
export function targetPath(
  ctx: Pick<Context, "cwd" | "config" | "project">,
  item: RegistryItem,
  file: string,
) {
  const { aliases } = ctx.config;
  const tsPaths = ctx.project.tsPaths;
  const base = path.basename(file);
  if (item.type === "lib") {
    if (item.name === "utils") {
      const utils = resolveAliasPath(ctx.cwd, aliases.utils, tsPaths);
      return utils + path.extname(file);
    }
    return path.join(resolveAliasPath(ctx.cwd, aliases.lib, tsPaths), base);
  }
  if (item.type === "hook")
    return path.join(resolveAliasPath(ctx.cwd, aliases.hooks, tsPaths), base);
  return path.join(resolveAliasPath(ctx.cwd, aliases.ui, tsPaths), base);
}

export interface PlannedFile {
  item: string;
  /** Absolute path on disk. */
  target: string;
  content: string;
}

export function planItemFiles(
  ctx: Pick<Context, "cwd" | "config" | "project">,
  item: RegistryItem,
): PlannedFile[] {
  return item.files.map((file) => {
    const transformed = transformFile(file, {
      aliases: ctx.config.aliases,
      tsx: ctx.config.tsx,
      rsc: ctx.config.rsc,
    });
    const target = targetPath(ctx, item, transformed.path);
    return { item: item.name, target, content: transformed.content };
  });
}
