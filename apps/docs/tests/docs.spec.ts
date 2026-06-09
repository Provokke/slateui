import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const SHOTS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../docs/screenshots",
);

const COMPONENTS: [slug: string, name: string][] = [
  ["button", "Button"],
  ["input", "Input"],
  ["label", "Label"],
  ["textarea", "Textarea"],
  ["checkbox", "Checkbox"],
  ["switch", "Switch"],
  ["select", "Select"],
  ["dialog", "Dialog"],
  ["dropdown-menu", "Dropdown Menu"],
  ["tooltip", "Tooltip"],
  ["popover", "Popover"],
  ["tabs", "Tabs"],
  ["accordion", "Accordion"],
  ["card", "Card"],
  ["badge", "Badge"],
  ["alert", "Alert"],
  ["avatar", "Avatar"],
  ["separator", "Separator"],
  ["skeleton", "Skeleton"],
  ["toast", "Toast"],
  ["table", "Table"],
  ["form", "Form"],
];

/** Collect console errors and uncaught exceptions for the lifetime of the page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    // The avatar demo intentionally points at a missing image to show the fallback.
    if (/does-not-exist\.png|Failed to load resource/.test(msg.text())) return;
    errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function axe(page: Page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const results = await (
      window as unknown as {
        axe: {
          run: (
            ctx: Document,
          ) => Promise<{ violations: { id: string; nodes: { html: string }[] }[] }>;
        };
      }
    ).axe.run(document);
    return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`);
  });
}

async function setTheme(page: Page, theme: "light" | "dark") {
  const toggle = page.getByTestId("theme-toggle");
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if ((theme === "dark") !== isDark) await toggle.click();
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
}

test.describe("component pages", () => {
  for (const [slug, name] of COMPONENTS) {
    test(`${slug} renders without console errors`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`/#/components/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect(page.getByTestId(`page-${slug}`)).toBeVisible();
      await expect(page.getByText(`npx slateui add ${slug}`)).toBeVisible();
      await page.waitForTimeout(100);
      expect(errors).toEqual([]);
    });
  }

  test("home lists every component and links work", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Components you own." }),
    ).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("link")).toHaveCount(COMPONENTS.length);
    await main.getByRole("link", { name: "Dialog" }).click();
    await expect(page).toHaveURL(/#\/components\/dialog$/);
    await expect(page.getByRole("heading", { level: 1, name: "Dialog" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "component-page-dialog.png") });
    expect(errors).toEqual([]);
  });
});

test.describe("interactions in a real browser", () => {
  test("dialog opens, traps focus, closes on Escape and restores focus", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/#/components/dialog");
    const trigger = page.getByRole("button", { name: "Edit profile" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Edit profile" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeFocused();
    await page.screenshot({ path: path.join(SHOTS, "dialog-open.png") });
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Save path closes the dialog and raises a toast
    await trigger.click();
    await page.getByLabel("Display name").fill("Grace Hopper");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("dropdown menu supports keyboard navigation", async ({ page }) => {
    await page.goto("/#/components/dropdown-menu");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Rename/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: /Duplicate/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("select picks a value", async ({ page }) => {
    await page.goto("/#/components/select");
    const trigger = page.getByRole("combobox", { name: "Timezone" });
    await trigger.click();
    await page.getByRole("option", { name: "Berlin" }).click();
    await expect(trigger).toHaveText(/Berlin/);
  });

  test("tooltip appears on keyboard focus", async ({ page }) => {
    await page.goto("/#/components/tooltip");
    await page.getByRole("button", { name: "Bold" }).focus();
    await expect(page.getByRole("tooltip")).toHaveText("Bold (Ctrl+B)");
  });

  test("popover, tabs and accordion respond to input", async ({ page }) => {
    await page.goto("/#/components/popover");
    await page.getByRole("button", { name: "Set dimensions" }).click();
    await expect(page.getByRole("dialog", { name: "Dimensions" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Dimensions" })).toBeHidden();

    await page.goto("/#/components/tabs");
    await page.getByRole("tab", { name: "Account" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Password" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tabpanel")).toHaveText("Change your password.");

    await page.goto("/#/components/accordion");
    const q = page.getByRole("button", { name: "Is it an npm dependency?" });
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("region", { name: "Is it an npm dependency?" })).toBeVisible();
  });

  test("toasts appear, can be dismissed, and the form validates", async ({ page }) => {
    await page.goto("/#/components/toast");
    await page.getByRole("button", { name: "Success" }).click();
    await page.getByRole("button", { name: "Error" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Upload failed" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, "toasts.png") });
    await page.getByRole("button", { name: "Dismiss notification" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeHidden();

    await page.goto("/#/components/form");
    const input = page.getByRole("textbox", { name: /Handle/ });
    await input.fill("ab");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Handle must be at least 3 characters.")).toBeVisible();
    await input.fill("ada");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(page.getByText("Looks good!")).toBeVisible();
  });
});

test.describe("theming", () => {
  test("theme toggle switches CSS variables and persists across reloads", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/#/components/button");
    await setTheme(page, "light");
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.screenshot({ path: path.join(SHOTS, "button-light.png") });

    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByTestId("theme-toggle")).toHaveAttribute("aria-pressed", "true");
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg).not.toBe(lightBg);
    await page.screenshot({ path: path.join(SHOTS, "button-dark.png") });

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.goto("/");
    await page.screenshot({ path: path.join(SHOTS, "home-dark.png"), fullPage: true });
    await setTheme(page, "light");
    await page.screenshot({ path: path.join(SHOTS, "home-light.png"), fullPage: true });
    expect(errors).toEqual([]);
  });
});

test.describe("axe-core in Chromium (including color contrast)", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const slug of ["button", "badge", "alert", "form", "table", "tabs"]) {
      test(`${slug} has no violations in ${theme} theme`, async ({ page }) => {
        await page.goto(`/#/components/${slug}`);
        await setTheme(page, theme);
        await expect(page.getByTestId(`page-${slug}`)).toBeVisible();
        expect(await axe(page)).toEqual([]);
      });
    }
  }
});
