import { existsSync } from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { readConfig, resolveAliasPath } from "../config.js";
import { findTsPaths } from "../detect.js";
import { logger } from "../logger.js";
import { createRegistry, type IndexItem } from "../registry.js";

export interface ListEntry extends IndexItem {
  installed: boolean;
}

export async function runList(options: {
  cwd: string;
  registry?: string;
  json?: boolean;
}): Promise<ListEntry[]> {
  const cwd = path.resolve(options.cwd);
  const config = readConfig(cwd);
  const registry = createRegistry(options.registry ?? config?.registry ?? "bundled", cwd);
  const index = await registry.getIndex();
  const uiDir = config ? resolveAliasPath(cwd, config.aliases.ui, findTsPaths(cwd)) : null;
  const entries = index.items
    .filter((i) => i.type === "ui")
    .map((item) => {
      const installed =
        uiDir !== null &&
        item.files.some((f) => {
          const base = path.basename(f);
          return (
            existsSync(path.join(uiDir, base)) ||
            existsSync(path.join(uiDir, base.replace(/\.tsx?$/, ".jsx")))
          );
        });
      return { ...item, installed };
    });
  if (options.json) {
    logger.info(JSON.stringify(entries, null, 2));
  } else {
    const width = Math.max(...entries.map((e) => e.name.length));
    logger.info(
      pc.bold(`${index.name} registry v${index.version} — ${entries.length} components\n`),
    );
    for (const e of entries) {
      const mark = e.installed ? pc.green("●") : pc.dim("○");
      logger.info(`${mark} ${e.name.padEnd(width)}  ${pc.dim(e.description ?? "")}`);
    }
    if (config) logger.info(pc.dim(`\n● installed  ○ available`));
  }
  return entries;
}
