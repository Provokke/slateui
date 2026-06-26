import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { setSilent } from "../src/logger.js";

setSilent(true);

const created: string[] = [];
afterEach(() => {
  while (created.length) rmSync(created.pop()!, { recursive: true, force: true });
});

/** Create a temp project from a { "relative/path": contents } map. */
export function fixture(files: Record<string, string | object>): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "slateui-cli-"));
  created.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}

export const nextAppFixture = () =>
  fixture({
    "package.json": {
      name: "next-fixture",
      dependencies: { next: "15.5.0", react: "19.1.0", "react-dom": "19.1.0" },
      devDependencies: { tailwindcss: "^4", "@tailwindcss/postcss": "^4", typescript: "^5" },
    },
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "tsconfig.json": `{
      // Next.js style config with comments and trailing commas
      "compilerOptions": {
        "strict": true,
        "paths": { "@/*": ["./src/*"], },
      },
    }`,
    "src/app/page.tsx": "export default function Page() { return null; }\n",
    "src/app/globals.css": '@import "tailwindcss";\n\nbody { margin: 0; }\n',
  });

export const viteFixture = () =>
  fixture({
    "package.json": {
      name: "vite-fixture",
      dependencies: { react: "^19.1.0", "react-dom": "^19.1.0" },
      devDependencies: { vite: "^7.1.0", tailwindcss: "^4.1.0", typescript: "~5.8.3" },
    },
    "package-lock.json": "{}",
    "vite.config.ts": "export default {}\n",
    "tsconfig.json": `{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }`,
    "tsconfig.app.json": `{
      "compilerOptions": {
        /* Bundler mode */
        "baseUrl": ".",
        "paths": { "~/*": ["./src/*"] }
      },
      "include": ["src"]
    }`,
    "tsconfig.node.json": `{ "compilerOptions": {} }`,
    "src/index.css": "",
    "src/main.tsx": "",
  });
