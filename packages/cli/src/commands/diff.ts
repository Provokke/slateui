import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createTwoFilesPatch } from "diff";
import pc from "picocolors";
import { CliError, logger } from "../logger.js";
import { loadContext, planItemFiles } from "../project.js";
import { createRegistry } from "../registry.js";

export interface FileDiff {
  item: string;
  file: string;
  patch: string;
}

export interface DiffResult {
  /** Components that are installed locally. */
  checked: string[];
  changed: FileDiff[];
}

export function colorizePatch(patch: string): string {
  return patch
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++") || line.startsWith("---")) return pc.bold(line);
      if (line.startsWith("+")) return pc.green(line);
      if (line.startsWith("-")) return pc.red(line);
      if (line.startsWith("@@")) return pc.cyan(line);
      return line;
    })
    .join("\n");
}

/**
 * Compare installed component files with the registry version (after alias
 * rewriting, so only real edits show up). Without a component, checks every
 * installed component and lists the ones that differ.
 */
export async function runDiff(options: {
  cwd: string;
  component?: string;
  registry?: string;
}): Promise<DiffResult> {
  const ctx = loadContext(path.resolve(options.cwd));
  const registry = createRegistry(options.registry ?? ctx.config.registry, ctx.cwd);
  const index = await registry.getIndex();
  const names = options.component ? [options.component] : index.items.map((i) => i.name);
  if (options.component && !index.items.some((i) => i.name === options.component)) {
    throw new CliError(`Unknown component "${options.component}".`);
  }

  const result: DiffResult = { checked: [], changed: [] };
  for (const name of names) {
    const item = await registry.getItem(name);
    const files = planItemFiles(ctx, item);
    if (!files.some((f) => existsSync(f.target))) {
      if (options.component) throw new CliError(`"${name}" is not installed in this project.`);
      continue;
    }
    result.checked.push(name);
    for (const file of files) {
      const rel = path.relative(ctx.cwd, file.target);
      const local = existsSync(file.target) ? readFileSync(file.target, "utf8") : "";
      if (local === file.content) continue;
      const patch = createTwoFilesPatch(
        `registry/${rel}`,
        `local/${rel}`,
        file.content,
        local,
        undefined,
        undefined,
        { context: 3 },
      );
      result.changed.push({ item: name, file: rel, patch });
    }
  }

  if (options.component) {
    if (result.changed.length === 0) logger.success(`${options.component} matches the registry.`);
    for (const change of result.changed) logger.info(colorizePatch(change.patch));
  } else if (result.changed.length === 0) {
    logger.success(`All ${result.checked.length} installed components match the registry.`);
  } else {
    logger.info("Components with local changes (run `slateui diff <name>` for details):");
    for (const name of new Set(result.changed.map((c) => c.item))) {
      const files = result.changed.filter((c) => c.item === name).map((c) => c.file);
      logger.info(`  ${pc.yellow(name)}  ${pc.dim(files.join(", "))}`);
    }
  }
  return result;
}
