import axe from "axe-core";
import { expect } from "vitest";

/**
 * Run axe-core against a DOM subtree (defaults to the whole body so portalled
 * content is included). color-contrast is disabled because jsdom has no layout
 * or computed colors; contrast is covered by the Playwright suite screenshots.
 */
export async function expectNoAxeViolations(context: Element = document.body) {
  const results = await axe.run(context, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  const messages = results.violations.map(
    (v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join("\n    ")}`,
  );
  expect(messages).toEqual([]);
}
