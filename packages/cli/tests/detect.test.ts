import { describe, expect, it } from "vitest";
import { detectPackageManager, detectProject, findTsPaths } from "../src/detect.js";
import { fixture, nextAppFixture, viteFixture } from "./helpers.js";

describe("detectProject", () => {
  it("detects a Next.js app-router project", () => {
    const cwd = nextAppFixture();
    const info = detectProject(cwd)!;
    expect(info.framework).toBe("next-app");
    expect(info.typescript).toBe(true);
    expect(info.aliasPrefix).toBe("@");
    expect(info.tailwind).toMatchObject({ version: 4, css: "src/app/globals.css" });
    expect(info.packageManager).toBe("pnpm");
  });

  it("detects a Vite project and follows tsconfig references for paths", () => {
    const cwd = viteFixture();
    const info = detectProject(cwd)!;
    expect(info.framework).toBe("vite");
    expect(info.aliasPrefix).toBe("~");
    expect(info.tsPaths?.file).toMatch(/tsconfig\.app\.json$/);
    expect(info.tailwind.css).toBe("src/index.css");
    expect(info.packageManager).toBe("npm");
  });

  it("detects a JavaScript project with jsconfig, Next pages router and Tailwind v3", () => {
    const cwd = fixture({
      "package.json": {
        dependencies: { next: "14.0.0" },
        devDependencies: { tailwindcss: "^3.4.0" },
      },
      "jsconfig.json": { compilerOptions: { paths: { "#/*": ["./*"] } } },
      "pages/index.jsx": "",
      "tailwind.config.js": "module.exports = {}",
      "styles/globals.css": "",
      "yarn.lock": "",
    });
    const info = detectProject(cwd)!;
    expect(info.framework).toBe("next-pages");
    expect(info.typescript).toBe(false);
    expect(info.aliasPrefix).toBe("#");
    expect(info.tailwind).toEqual({
      version: 3,
      css: "styles/globals.css",
      config: "tailwind.config.js",
    });
    expect(info.packageManager).toBe("yarn");
  });

  it("returns null without package.json and reports 'other' frameworks", () => {
    expect(detectProject(fixture({ "README.md": "" }))).toBeNull();
    const info = detectProject(fixture({ "package.json": {} }))!;
    expect(info.framework).toBe("other");
    expect(info.aliasPrefix).toBeNull();
    expect(info.tailwind.version).toBeNull();
  });
});

describe("detectPackageManager", () => {
  it.each([
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ])("%s -> %s", (lockfile, pm) => {
    expect(detectPackageManager(fixture({ [lockfile]: "" }))).toBe(pm);
  });

  it("falls back to the packageManager field", () => {
    const cwd = fixture({ "package.json": {} });
    expect(detectPackageManager(cwd, { packageManager: "pnpm@10.0.0" })).toBe("pnpm");
  });
});

describe("findTsPaths", () => {
  it("resolves baseUrl relative to the config file", () => {
    const cwd = fixture({
      "tsconfig.json": { compilerOptions: { baseUrl: "./web", paths: { "@/*": ["src/*"] } } },
    });
    const found = findTsPaths(cwd)!;
    expect(found.baseDir).toBe(`${cwd}/web`);
    expect(found.paths["@/*"]).toEqual(["src/*"]);
  });
});
