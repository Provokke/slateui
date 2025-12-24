import { readFileSync } from "node:fs";
import { Command } from "commander";
import { runAdd } from "./commands/add.js";
import { runDiff } from "./commands/diff.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { CliError, logger } from "./logger.js";

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("slateui")
    .description("Copy accessible React components into your project. You own the code.")
    .version(version());

  program
    .command("init")
    .description("detect your setup and write slateui.json, the cn() util and theme CSS variables")
    .option("-c, --cwd <dir>", "project directory", process.cwd())
    .option("-y, --yes", "accept detected defaults without prompting", false)
    .option("-f, --force", "overwrite an existing slateui.json", false)
    .option("-r, --registry <source>", 'registry: "bundled", a local path, or an http(s) URL')
    .option("--css <file>", "global CSS file to add theme variables to")
    .option("--alias <prefix>", 'import alias prefix, e.g. "@" or "~"')
    .option("--no-install", "do not install npm dependencies")
    .action(async (opts) => {
      await runInit(opts);
    });

  program
    .command("add")
    .description("copy components (and their registry dependencies) into your project")
    .argument("[components...]", "component names, e.g. button dialog")
    .option("-c, --cwd <dir>", "project directory", process.cwd())
    .option("-a, --all", "add every component", false)
    .option("-y, --yes", "never prompt; skip files that have local changes", false)
    .option("-o, --overwrite", "overwrite files that have local changes", false)
    .option("-r, --registry <source>", "override the registry from slateui.json")
    .option("--no-install", "do not install npm dependencies")
    .action(async (components: string[], opts) => {
      await runAdd({ ...opts, components });
    });

  program
    .command("diff")
    .description("show local changes compared to the registry")
    .argument("[component]", "component to diff; omit to check all installed components")
    .option("-c, --cwd <dir>", "project directory", process.cwd())
    .option("-r, --registry <source>", "override the registry from slateui.json")
    .action(async (component: string | undefined, opts) => {
      await runDiff({ ...opts, component });
    });

  program
    .command("list")
    .description("list available components")
    .option("-c, --cwd <dir>", "project directory", process.cwd())
    .option("-r, --registry <source>", "registry to list")
    .option("--json", "print JSON", false)
    .action(async (opts) => {
      await runList(opts);
    });

  return program;
}

export async function run(argv: string[]): Promise<number> {
  try {
    await buildProgram().parseAsync(argv);
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      logger.error(error.message);
      return 1;
    }
    throw error;
  }
}
