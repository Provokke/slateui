import { describe, expect, it } from "vitest";
import { parseJsonc } from "../src/jsonc.js";
import { resolveTree, suggest } from "../src/resolve.js";
import { rewriteImports, stripUseClient, toJavaScript, transformFile } from "../src/transform.js";
import { defaultAliases, resolveAliasPath } from "../src/config.js";
import { injectTheme, THEME_END, THEME_START } from "../src/css.js";
import { bareName, installCommand, missingPackages } from "../src/install.js";
import path from "node:path";

describe("parseJsonc", () => {
  it("strips line/block comments and trailing commas but keeps '/*' inside strings", () => {
    const parsed = parseJsonc<{ a: { paths: Record<string, string[]> }; b: number[] }>(`{
      // comment
      "a": { "paths": { "@/*": ["./src/*"], }, }, /* block
      comment */
      "b": [1, 2,],
      "c": "http://x.dev/a//b",
      "d": "quote \\" // not a comment"
    }`);
    expect(parsed.a.paths["@/*"]).toEqual(["./src/*"]);
    expect(parsed.b).toEqual([1, 2]);
    expect((parsed as unknown as Record<string, string>).c).toBe("http://x.dev/a//b");
    expect((parsed as unknown as Record<string, string>).d).toBe('quote " // not a comment');
  });
});

describe("rewriteImports", () => {
  const src = [
    'import { cn } from "@/lib/utils";',
    'import { Label } from "@/components/ui/label";',
    "import { useThing } from '@/hooks/use-thing';",
    'import { Other } from "@/components/other";',
    'export { x } from "@/lib/x";',
    'import "@/styles/side.css";',
    'const lazy = import("@/components/ui/dialog");',
    'import * as React from "react";',
    'const s = "@/lib/utils is just a string";',
  ].join("\n");

  it("maps canonical @/ imports to the project's aliases", () => {
    const out = rewriteImports(src, {
      components: "~/ui-kit",
      ui: "~/ui-kit/primitives",
      lib: "~/helpers",
      utils: "~/helpers/cn",
      hooks: "~/use",
    });
    expect(out).toContain('from "~/helpers/cn"');
    expect(out).toContain('from "~/ui-kit/primitives/label"');
    expect(out).toContain("from '~/use/use-thing'");
    expect(out).toContain('from "~/ui-kit/other"');
    expect(out).toContain('from "~/helpers/x"');
    expect(out).toContain('import "~/styles/side.css"');
    expect(out).toContain('import("~/ui-kit/primitives/dialog")');
    expect(out).toContain('from "react"');
    // plain strings are not import specifiers
    expect(out).toContain('"@/lib/utils is just a string"');
  });

  it("is a no-op with default @ aliases", () => {
    expect(rewriteImports(src, defaultAliases("@"))).toBe(src);
  });
});

describe("transformFile", () => {
  const file = {
    path: "ui/label.tsx",
    content:
      '"use client";\n\nimport * as React from "react";\nimport { cn } from "@/lib/utils";\n\nexport function L({ a }: { a: string }): React.ReactNode {\n  return <span className={cn(a)} />;\n}\n',
  };

  it("keeps 'use client' for RSC projects and strips it otherwise", () => {
    expect(
      transformFile(file, { aliases: defaultAliases("@"), tsx: true, rsc: true }).content,
    ).toMatch(/^"use client";/);
    const stripped = transformFile(file, { aliases: defaultAliases("@"), tsx: true, rsc: false });
    expect(stripped.content.startsWith("import * as React")).toBe(true);
    expect(stripUseClient("'use client'\nx")).toBe("x");
  });

  it("emits JSX without types for JavaScript projects", () => {
    const out = transformFile(file, { aliases: defaultAliases("#"), tsx: false, rsc: false });
    expect(out.path).toBe("ui/label.jsx");
    expect(out.content).toContain('from "#/lib/utils"');
    expect(out.content).toContain("<span className={cn(a)}/>");
    expect(out.content).not.toMatch(/: string|React\.ReactNode/);
    expect(toJavaScript("const a: number = 1;", "a.ts").trim()).toBe("const a = 1;");
  });
});

describe("resolveTree", () => {
  const items = [
    { name: "utils", registryDependencies: [] },
    { name: "label", registryDependencies: ["utils"] },
    { name: "form", registryDependencies: ["utils", "label"] },
    { name: "button", registryDependencies: ["utils"] },
    { name: "a", registryDependencies: ["b"] },
    { name: "b", registryDependencies: ["c"] },
    { name: "c", registryDependencies: ["a", "utils"] },
    { name: "self", registryDependencies: ["self"] },
    { name: "broken", registryDependencies: ["nope"] },
  ];

  it("resolves transitively with dependencies first and no duplicates", () => {
    expect(resolveTree(items, ["form", "button"]).order).toEqual([
      "utils",
      "label",
      "form",
      "button",
    ]);
    expect(resolveTree(items, ["button", "button"]).order).toEqual(["utils", "button"]);
  });

  it("terminates on cycles and reports them", () => {
    const { order, cycles } = resolveTree(items, ["a"]);
    expect(order).toEqual(["utils", "c", "b", "a"]);
    expect(cycles).toEqual([["a", "b", "c", "a"]]);
    expect(resolveTree(items, ["self"]).cycles).toEqual([["self", "self"]]);
  });

  it("errors on unknown names with context and suggestions", () => {
    expect(() => resolveTree(items, ["buton"])).toThrow(
      /Unknown component "buton"\. Did you mean "button"\?/,
    );
    expect(() => resolveTree(items, ["broken"])).toThrow(/"nope" \(required by "broken"\)/);
    expect(suggest("zzzzzz", ["button"])).toBeNull();
  });
});

describe("resolveAliasPath", () => {
  const tsPaths = {
    baseDir: "/proj",
    file: "/proj/tsconfig.json",
    paths: {
      "@/*": ["./src/*"],
      "@ui/*": ["./packages/ui/*"],
      "@/components/*": ["./app/components/*"],
    },
  };
  it("uses the longest matching tsconfig paths pattern", () => {
    expect(resolveAliasPath("/proj", "@/lib/utils", tsPaths)).toBe(
      path.resolve("/proj/src/lib/utils"),
    );
    expect(resolveAliasPath("/proj", "@/components/ui", tsPaths)).toBe(
      path.resolve("/proj/app/components/ui"),
    );
    expect(resolveAliasPath("/proj", "@ui/button", tsPaths)).toBe(
      path.resolve("/proj/packages/ui/button"),
    );
  });
  it("falls back to src/ or the root when no paths are configured", () => {
    expect(resolveAliasPath("/nowhere", "@/components/ui", null)).toBe(
      path.join("/nowhere", "components/ui"),
    );
  });
});

describe("injectTheme", () => {
  const theme = ":root { --brand: red; }";
  it("adds the block after @import tailwindcss and is idempotent", () => {
    const once = injectTheme('@import "tailwindcss";\nbody { margin: 0 }\n', theme);
    expect(once.indexOf('@import "tailwindcss"')).toBe(0);
    expect(once).toContain(`${THEME_START}\n${theme}\n${THEME_END}`);
    expect(once).toContain("body { margin: 0 }");
    expect(injectTheme(once, theme)).toBe(once);
    const updated = injectTheme(once, ":root { --brand: blue; }");
    expect(updated).toContain("--brand: blue");
    expect(updated).not.toContain("--brand: red");
  });
  it("adds @import tailwindcss when missing", () => {
    expect(injectTheme("", theme).startsWith('@import "tailwindcss";')).toBe(true);
  });
});

describe("install helpers", () => {
  it("builds package-manager specific commands", () => {
    expect(installCommand("npm", ["a"])).toEqual(["npm", ["install", "a"]]);
    expect(installCommand("pnpm", ["a"])).toEqual(["pnpm", ["add", "a"]]);
    expect(installCommand("yarn", ["a"])).toEqual(["yarn", ["add", "a"]]);
    expect(installCommand("bun", ["a"])).toEqual(["bun", ["add", "a"]]);
  });
  it("filters already-installed and duplicate packages", () => {
    expect(bareName("@radix-ui/react-slot@^1.2.3")).toBe("@radix-ui/react-slot");
    expect(bareName("clsx")).toBe("clsx");
    expect(
      missingPackages(["clsx@^2", "@radix-ui/react-slot@^1", "clsx@^2", "cva@^0.7"], {
        cva: "0.7.0",
      }),
    ).toEqual(["clsx@^2", "@radix-ui/react-slot@^1"]);
  });
});
