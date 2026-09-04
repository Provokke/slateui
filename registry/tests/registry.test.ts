import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  importSpecifiers,
  loadItems,
  packageName,
  validateItems,
} from "../scripts/registry-lib.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("registry metadata", () => {
  const items = loadItems(root);

  it("contains every required component", () => {
    const names = items.map((i) => i.name);
    for (const required of [
      "utils",
      "button",
      "input",
      "label",
      "textarea",
      "checkbox",
      "switch",
      "select",
      "dialog",
      "dropdown-menu",
      "tooltip",
      "popover",
      "tabs",
      "accordion",
      "card",
      "badge",
      "alert",
      "avatar",
      "separator",
      "skeleton",
      "toast",
      "table",
      "form",
    ]) {
      expect(names).toContain(required);
    }
  });

  it("metadata matches the imports in each source file", () => {
    expect(validateItems(root, items)).toEqual([]);
  });

  it("helpers parse import specifiers and package names", () => {
    expect(
      importSpecifiers(
        `import * as React from "react";\nimport { a } from '@radix-ui/react-slot/x';\nimport "./side.css";\nexport { b } from "clsx";`,
      ),
    ).toEqual(["react", "@radix-ui/react-slot/x", "./side.css", "clsx"]);
    expect(packageName("@radix-ui/react-slot/x")).toBe("@radix-ui/react-slot");
    expect(packageName("clsx/lite")).toBe("clsx");
  });
});
