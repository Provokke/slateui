import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runAdd } from "../src/commands/add.js";
import { runDiff } from "../src/commands/diff.js";
import { runInit } from "../src/commands/init.js";
import { runList } from "../src/commands/list.js";
import { run } from "../src/cli.js";
import { readConfig } from "../src/config.js";
import { THEME_START } from "../src/css.js";
import { fixture, nextAppFixture, viteFixture } from "./helpers.js";

const REGISTRY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../registry/dist",
);
const read = (...p: string[]) => readFileSync(path.join(...p), "utf8");

describe("init", () => {
  it("configures a Next.js app (rsc, @ alias, globals.css)", async () => {
    const cwd = nextAppFixture();
    const result = await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    expect(result.config).toMatchObject({
      framework: "next-app",
      tsx: true,
      rsc: true,
      tailwind: { css: "src/app/globals.css", version: 4 },
      aliases: { ui: "@/components/ui", utils: "@/lib/utils" },
    });
    expect(readConfig(cwd)?.registry).toBe(REGISTRY);
    expect(read(cwd, "src/lib/utils.ts")).toContain("export function cn(");
    const css = read(cwd, "src/app/globals.css");
    expect(css.startsWith('@import "tailwindcss";')).toBe(true);
    expect(css).toContain(THEME_START);
    expect(css).toContain("--color-brand: var(--brand)");
    expect(css).toContain("body { margin: 0; }");
  });

  it("configures a Vite app with a custom ~ alias from tsconfig.app.json", async () => {
    const cwd = viteFixture();
    const result = await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    expect(result.config.framework).toBe("vite");
    expect(result.config.rsc).toBe(false);
    expect(result.config.aliases.utils).toBe("~/lib/utils");
    expect(existsSync(path.join(cwd, "src/lib/utils.ts"))).toBe(true);
    expect(read(cwd, "src/index.css")).toContain("@custom-variant dark");
  });

  it("fails clearly outside a project", async () => {
    await expect(runInit({ cwd: fixture({ "a.txt": "" }), yes: true })).rejects.toThrow(
      /No package.json/,
    );
  });
});

describe("add", () => {
  it("resolves registry dependencies and rewrites imports", async () => {
    const cwd = viteFixture();
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    const result = await runAdd({ cwd, components: ["form"], yes: true, install: false });
    expect(result.resolved).toEqual(["utils", "label", "form"]);
    expect(result.unchanged.map((f) => path.relative(cwd, f))).toEqual(["src/lib/utils.ts"]);
    const form = read(cwd, "src/components/ui/form.tsx");
    expect(form).toContain('from "~/components/ui/label"');
    expect(form).toContain('from "~/lib/utils"');
    expect(form).not.toContain('"use client"');
    expect(form).not.toContain("@/");
  });

  it("adds everything with --all and keeps 'use client' for Next.js", async () => {
    const cwd = nextAppFixture();
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    const result = await runAdd({ cwd, components: [], all: true, yes: true, install: false });
    expect(result.resolved).toHaveLength(23);
    expect(result.written).toHaveLength(22);
    expect(read(cwd, "src/components/ui/dialog.tsx").startsWith('"use client";')).toBe(true);
    expect(read(cwd, "src/components/ui/card.tsx")).not.toContain("use client");
  });

  it("skips locally modified files with --yes and replaces them with --overwrite", async () => {
    const cwd = nextAppFixture();
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    await runAdd({ cwd, components: ["button"], yes: true, install: false });
    const file = path.join(cwd, "src/components/ui/button.tsx");
    writeFileSync(file, read(file) + "\n// my tweak\n");

    const skipped = await runAdd({ cwd, components: ["button"], yes: true, install: false });
    expect(skipped.skipped).toEqual([file]);
    expect(read(file)).toContain("my tweak");

    const replaced = await runAdd({ cwd, components: ["button"], overwrite: true, install: false });
    expect(replaced.written).toEqual([file]);
    expect(read(file)).not.toContain("my tweak");
  });

  it("emits .jsx without types for JavaScript projects", async () => {
    const cwd = fixture({
      "package.json": { dependencies: { vite: "^7" }, devDependencies: { tailwindcss: "^4" } },
      "jsconfig.json": { compilerOptions: { paths: { "@/*": ["./src/*"] } } },
      "src/index.css": "",
    });
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    expect(readConfig(cwd)?.tsx).toBe(false);
    await runAdd({ cwd, components: ["badge"], yes: true, install: false });
    expect(existsSync(path.join(cwd, "src/lib/utils.js"))).toBe(true);
    const badge = read(cwd, "src/components/ui/badge.jsx");
    expect(badge).toContain('from "@/lib/utils"');
    expect(badge).not.toMatch(/interface|VariantProps<|: BadgeProps/);
  });

  it("reports unknown components and requires init", async () => {
    const cwd = nextAppFixture();
    await expect(runAdd({ cwd, components: ["button"], yes: true })).rejects.toThrow(
      /slateui init/,
    );
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    await expect(
      runAdd({ cwd, components: ["dialgo"], yes: true, install: false }),
    ).rejects.toThrow(/Did you mean "dialog"/);
  });
});

describe("diff", () => {
  it("shows no changes for pristine files and a patch for edited ones", async () => {
    const cwd = nextAppFixture();
    await runInit({ cwd, yes: true, registry: REGISTRY, install: false });
    await runAdd({ cwd, components: ["badge", "card"], yes: true, install: false });

    const clean = await runDiff({ cwd });
    expect(clean.checked.sort()).toEqual(["badge", "card", "utils"]);
    expect(clean.changed).toEqual([]);

    const file = path.join(cwd, "src/components/ui/badge.tsx");
    writeFileSync(file, read(file).replace("rounded-full", "rounded-sm"));
    const all = await runDiff({ cwd });
    expect(all.changed.map((c) => c.item)).toEqual(["badge"]);

    const one = await runDiff({ cwd, component: "badge" });
    expect(one.changed).toHaveLength(1);
    expect(one.changed[0].patch).toMatch(/^-.*rounded-full/m);
    expect(one.changed[0].patch).toMatch(/^\+.*rounded-sm/m);
    await expect(runDiff({ cwd, component: "dialog" })).rejects.toThrow(/not installed/);
  });
});

describe("registry over HTTP", () => {
  let server: Server;
  let url = "";
  beforeAll(async () => {
    server = createServer((req, res) => {
      const file = path.join(REGISTRY, decodeURIComponent(req.url ?? "/"));
      if (!file.startsWith(REGISTRY) || !existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": "application/json" }).end(readFileSync(file));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("init/add/list work against a URL registry", async () => {
    const cwd = nextAppFixture();
    await runInit({ cwd, yes: true, registry: url, install: false });
    const result = await runAdd({ cwd, components: ["tooltip"], yes: true, install: false });
    expect(result.written.map((f) => path.basename(f))).toEqual(["tooltip.tsx"]);
    const entries = await runList({ cwd });
    expect(entries.find((e) => e.name === "tooltip")?.installed).toBe(true);
    expect(entries.find((e) => e.name === "dialog")?.installed).toBe(false);
    await expect(
      runAdd({ cwd, components: ["x"], yes: true, registry: `${url}/missing` }),
    ).rejects.toThrow(/404/);
  });
});

describe("cli entry", () => {
  it("returns exit code 1 with a friendly error", async () => {
    const cwd = fixture({ "package.json": {} });
    expect(await run(["node", "slateui", "add", "button", "--cwd", cwd, "--yes"])).toBe(1);
  });

  it("list --json prints every ui component", async () => {
    const entries = await runList({ cwd: fixture({}), registry: REGISTRY, json: true });
    expect(entries.map((e) => e.name)).toContain("dropdown-menu");
    expect(entries).toHaveLength(22);
  });
});
