/**
 * End-to-end: scaffold real apps with the official generators, run
 * `slateui init` + `slateui add --all` from the local registry, then prove the
 * copied source type-checks and production-builds.
 *
 * Requires network access to the npm registry. Set SLATEUI_E2E_KEEP=1 to keep
 * the temp apps for inspection.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ALL_UI, CLI, REGISTRY, SHOWCASE, read, sh, slateui, workdir, write } from "./helpers";

const work = workdir();
afterAll(() => {
  if (!process.env.SLATEUI_E2E_KEEP) rmSync(work, { recursive: true, force: true });
});

function assertBuiltCli() {
  expect(existsSync(CLI), "build the CLI first: pnpm build").toBe(true);
  expect(existsSync(path.join(REGISTRY, "index.json")), "build the registry first").toBe(true);
}

describe("Vite + React + TypeScript (create-vite, npm)", () => {
  const app = path.join(work, "vite-app");

  it("scaffolds the app and sets up Tailwind v4 + the @ alias", async () => {
    assertBuiltCli();
    await sh("npx", ["-y", "create-vite@7.1.3", "vite-app", "--template", "react-ts"], work);
    await sh("npm", ["install", "--no-audit", "--no-fund"], app);
    await sh(
      "npm",
      [
        "install",
        "-D",
        "--no-audit",
        "--no-fund",
        "tailwindcss@4.1.18",
        "@tailwindcss/vite@4.1.18",
        "@types/node@22",
      ],
      app,
    );
    write(
      path.join(app, "vite.config.ts"),
      `import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
`,
    );
    // Add the path alias to tsconfig.app.json (keeps the template's comments).
    const tsApp = path.join(app, "tsconfig.app.json");
    write(
      tsApp,
      read(tsApp).replace(
        '"compilerOptions": {',
        '"compilerOptions": {\n    "baseUrl": ".",\n    "paths": { "@/*": ["./src/*"] },',
      ),
    );
    write(path.join(app, "src/index.css"), '@import "tailwindcss";\n');
  });

  it("slateui init detects vite/npm/@ and writes config, cn util and theme", async () => {
    const out = await slateui(["init", "--yes", "--registry", REGISTRY], app);
    expect(out).toMatch(/Detected .*vite.*TypeScript.*Tailwind 4.*npm/);
    const config = JSON.parse(read(app, "slateui.json"));
    expect(config).toMatchObject({ framework: "vite", tsx: true, rsc: false });
    expect(config.aliases.ui).toBe("@/components/ui");
    expect(read(app, "src/lib/utils.ts")).toContain("twMerge");
    expect(read(app, "src/index.css")).toContain("--color-brand");
    const pkg = JSON.parse(read(app, "package.json"));
    expect(pkg.dependencies).toHaveProperty("clsx");
    expect(pkg.dependencies).toHaveProperty("tailwind-merge");
  });

  it("slateui add --all copies every component and installs its dependencies", async () => {
    await slateui(["add", "--all", "--yes"], app);
    const files = readdirSync(path.join(app, "src/components/ui")).sort();
    expect(files).toEqual(ALL_UI.map((n) => `${n}.tsx`).sort());
    const pkg = JSON.parse(read(app, "package.json"));
    for (const dep of [
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "class-variance-authority",
    ]) {
      expect(pkg.dependencies).toHaveProperty(dep);
    }
    expect(read(app, "src/components/ui/dialog.tsx")).not.toContain("use client");
    // a second run is a no-op
    expect(await slateui(["add", "--all", "--yes"], app)).toMatch(
      /0 written, 23 unchanged, 0 skipped/,
    );
    expect(await slateui(["diff"], app)).toMatch(/All 23 installed components match the registry/);
  });

  it("type-checks (tsc --noEmit) and builds for production", async () => {
    write(path.join(app, "src/App.tsx"), read(SHOWCASE));
    await sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.app.json"], app);
    await sh("npm", ["run", "build"], app);
    const assets = readdirSync(path.join(app, "dist/assets"));
    const css = assets.find((f) => f.endsWith(".css"))!;
    const builtCss = read(app, "dist/assets", css);
    expect(builtCss).toContain("--brand");
    expect(builtCss).toMatch(/\.bg-brand\b/);
    expect(assets.some((f) => f.endsWith(".js"))).toBe(true);
  });
});

describe("Next.js app router (create-next-app, pnpm)", () => {
  const app = path.join(work, "next-app");

  it("scaffolds the app with Tailwind v4 and src/ + @/* alias", async () => {
    assertBuiltCli();
    await sh(
      "npx",
      [
        "-y",
        "create-next-app@15.5.29",
        "next-app",
        "--ts",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
        "--use-pnpm",
        "--no-turbopack",
        "--yes",
        "--disable-git",
      ],
      work,
    );
    expect(existsSync(path.join(app, "pnpm-lock.yaml"))).toBe(true);
  });

  it("slateui init detects next-app/pnpm and keeps RSC directives", async () => {
    const out = await slateui(["init", "--yes", "--registry", REGISTRY], app);
    expect(out).toMatch(/Detected .*next-app.*TypeScript.*Tailwind 4.*pnpm/);
    const config = JSON.parse(read(app, "slateui.json"));
    expect(config).toMatchObject({ framework: "next-app", rsc: true });
    expect(config.tailwind.css).toBe("src/app/globals.css");
    expect(read(app, "src/app/globals.css")).toContain("slateui:theme:start");
  });

  it("slateui add --all installs with pnpm", async () => {
    await slateui(["add", "--all", "--yes"], app);
    expect(readdirSync(path.join(app, "src/components/ui")).sort()).toEqual(
      ALL_UI.map((n) => `${n}.tsx`).sort(),
    );
    expect(read(app, "src/components/ui/dialog.tsx").startsWith('"use client";')).toBe(true);
    expect(JSON.parse(read(app, "package.json")).dependencies).toHaveProperty(
      "@radix-ui/react-tabs",
    );
  });

  it("type-checks and runs next build", async () => {
    write(path.join(app, "src/components/showcase.tsx"), `"use client";\n\n${read(SHOWCASE)}`);
    // Avoid next/font/google (needs fonts.googleapis.com at build time).
    write(
      path.join(app, "src/app/layout.tsx"),
      `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "slateui e2e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    );
    write(
      path.join(app, "src/app/page.tsx"),
      `import Showcase from "@/components/showcase";
import { Badge } from "@/components/ui/badge";

// Server component rendering a server-safe slateui component and a client island.
export default function Home() {
  return (
    <>
      <Badge tone="brand">server rendered</Badge>
      <Showcase />
    </>
  );
}
`,
    );
    await sh("npx", ["tsc", "--noEmit"], app);
    const out = await sh("pnpm", ["run", "build"], app);
    expect(out).toMatch(/Compiled successfully|Generating static pages/);
    expect(existsSync(path.join(app, ".next/BUILD_ID"))).toBe(true);
  });
});
