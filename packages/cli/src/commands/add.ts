import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pc from "picocolors";
import prompts from "prompts";
import { installPackages, missingPackages } from "../install.js";
import { CliError, logger } from "../logger.js";
import { loadContext, planItemFiles, type PlannedFile } from "../project.js";
import { createRegistry } from "../registry.js";
import { resolveTree } from "../resolve.js";

export interface AddOptions {
  cwd: string;
  components: string[];
  all?: boolean;
  yes?: boolean;
  overwrite?: boolean;
  install?: boolean;
  registry?: string;
}

export interface AddResult {
  resolved: string[];
  written: string[];
  unchanged: string[];
  skipped: string[];
  installed: string[];
}

export async function runAdd(options: AddOptions): Promise<AddResult> {
  const ctx = loadContext(path.resolve(options.cwd));
  const registry = createRegistry(options.registry ?? ctx.config.registry, ctx.cwd);
  const index = await registry.getIndex();

  let requested = options.components;
  if (options.all) requested = index.items.filter((i) => i.type === "ui").map((i) => i.name);
  if (requested.length === 0) {
    if (options.yes)
      throw new CliError("No components given. Try `slateui add button` or `--all`.");
    const { picked } = await prompts({
      type: "multiselect",
      name: "picked",
      message: "Which components would you like to add?",
      choices: index.items
        .filter((i) => i.type === "ui")
        .map((i) => ({ title: i.name, value: i.name, description: i.description })),
    });
    requested = (picked as string[] | undefined) ?? [];
    if (requested.length === 0) throw new CliError("Nothing selected.");
  }

  const { order, cycles } = resolveTree(index.items, requested);
  for (const cycle of cycles) logger.warn(`Dependency cycle ignored: ${cycle.join(" -> ")}`);
  logger.step(`Resolved: ${order.join(", ")}`);

  const items = await Promise.all(order.map((name) => registry.getItem(name)));
  const planned: PlannedFile[] = items.flatMap((item) => planItemFiles(ctx, item));

  const result: AddResult = {
    resolved: order,
    written: [],
    unchanged: [],
    skipped: [],
    installed: [],
  };
  for (const file of planned) {
    const rel = path.relative(ctx.cwd, file.target);
    if (existsSync(file.target)) {
      const current = readFileSync(file.target, "utf8");
      if (current === file.content) {
        result.unchanged.push(file.target);
        continue;
      }
      let overwrite = options.overwrite === true;
      if (!overwrite && !options.yes) {
        const answer = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `${rel} has local changes. Overwrite it?`,
          initial: false,
        });
        overwrite = answer.overwrite === true;
      }
      if (!overwrite) {
        result.skipped.push(file.target);
        logger.warn(`skipped ${rel} (exists; pass --overwrite to replace)`);
        continue;
      }
    }
    mkdirSync(path.dirname(file.target), { recursive: true });
    writeFileSync(file.target, file.content);
    result.written.push(file.target);
    logger.success(`${pc.dim("wrote")} ${rel}`);
  }
  for (const f of result.unchanged) logger.info(pc.dim(`  unchanged ${path.relative(ctx.cwd, f)}`));

  const deps = items.flatMap((i) => i.dependencies);
  const toInstall = missingPackages(deps, ctx.project.dependencies);
  if (options.install !== false) {
    installPackages(ctx.cwd, ctx.project.packageManager, toInstall);
    result.installed = toInstall;
  } else if (toInstall.length) {
    logger.info(`Skipped installing: ${toInstall.join(" ")}`);
  }
  logger.info(
    `\n${pc.green("Done.")} ${result.written.length} written, ${result.unchanged.length} unchanged, ${result.skipped.length} skipped.`,
  );
  return result;
}
