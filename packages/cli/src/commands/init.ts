import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pc from "picocolors";
import prompts from "prompts";
import {
  CONFIG_FILE,
  defaultAliases,
  readConfig,
  writeConfig,
  type SlateConfig,
} from "../config.js";
import { injectTheme } from "../css.js";
import { detectProject } from "../detect.js";
import { installPackages, missingPackages } from "../install.js";
import { CliError, logger } from "../logger.js";
import { planItemFiles } from "../project.js";
import { createRegistry } from "../registry.js";

export interface InitOptions {
  cwd: string;
  yes?: boolean;
  force?: boolean;
  registry?: string;
  css?: string;
  alias?: string;
  install?: boolean;
}

export interface InitResult {
  config: SlateConfig;
  written: string[];
  installed: string[];
}

export async function runInit(options: InitOptions): Promise<InitResult> {
  const cwd = path.resolve(options.cwd);
  const project = detectProject(cwd);
  if (!project) throw new CliError(`No package.json found in ${cwd}. Create a project first.`);

  const existing = readConfig(cwd);
  if (existing && !options.force && !options.yes) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `${CONFIG_FILE} already exists. Overwrite it?`,
      initial: false,
    });
    if (!overwrite) throw new CliError("Aborted.");
  }

  logger.step(
    `Detected ${pc.bold(project.framework)} · ${project.typescript ? "TypeScript" : "JavaScript"} · ` +
      `Tailwind ${project.tailwind.version ?? "not found"} · ${project.packageManager}`,
  );
  if (project.tailwind.version === null) {
    logger.warn(
      "Tailwind CSS was not found in package.json. slateui components need Tailwind CSS v4.",
    );
  } else if (project.tailwind.version === 3) {
    logger.warn(
      "Tailwind CSS v3 detected. slateui's theme targets v4 (@theme); upgrade with `npx @tailwindcss/upgrade`.",
    );
  }

  let prefix = options.alias ?? project.aliasPrefix;
  if (!prefix) {
    logger.warn(
      'No import alias found in tsconfig/jsconfig "paths". Using "@" — add `"paths": { "@/*": ["./src/*"] }` ' +
        "to your tsconfig and bundler config.",
    );
    prefix = "@";
  }
  let css = options.css ?? project.tailwind.css ?? "src/index.css";

  if (!options.yes) {
    const answers = await prompts([
      { type: "text", name: "css", message: "Global CSS file", initial: css },
      { type: "text", name: "prefix", message: "Import alias prefix", initial: prefix },
    ]);
    css = answers.css ?? css;
    prefix = answers.prefix ?? prefix;
  }

  const config: SlateConfig = {
    registry: options.registry ?? existing?.registry ?? "bundled",
    framework: project.framework,
    tsx: project.typescript,
    rsc: project.framework === "next-app",
    tailwind: { css, version: project.tailwind.version },
    aliases: defaultAliases(prefix!),
  };

  const registry = createRegistry(config.registry, cwd);
  const index = await registry.getIndex();
  const utils = await registry.getItem("utils");

  writeConfig(cwd, config);
  const written = [path.join(cwd, CONFIG_FILE)];

  for (const file of planItemFiles({ cwd, config, project }, utils)) {
    mkdirSync(path.dirname(file.target), { recursive: true });
    writeFileSync(file.target, file.content);
    written.push(file.target);
  }

  const cssPath = path.join(cwd, css);
  mkdirSync(path.dirname(cssPath), { recursive: true });
  const before = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  writeFileSync(cssPath, injectTheme(before, index.theme.css));
  written.push(cssPath);

  const toInstall = missingPackages(utils.dependencies, project.dependencies);
  if (options.install !== false) installPackages(cwd, project.packageManager, toInstall);

  for (const file of written) logger.success(`wrote ${path.relative(cwd, file)}`);
  logger.info(
    `\n${pc.green("slateui is ready.")} Add components with ${pc.cyan("slateui add button")}.`,
  );
  return { config, written, installed: options.install === false ? [] : toInstall };
}
