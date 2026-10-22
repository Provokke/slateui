<div align="center">

# slateui

Accessible React components that you **copy into your project** instead of installing.

![License](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)  ![Language](https://img.shields.io/badge/TYPESCRIPT-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

Refer to [LICENSE](LICENSE) for the legal bits.

</div>

## Why copy-paste?

- **You own the markup and styles.** No `className` override battles or wrapper components
  around a black box. Change the actual source.
- **No breaking upgrades behind your back.** A component never changes unless you run
  `slateui add --overwrite` or merge a diff yourself.
- **Tree-shaken by construction.** You only have the files you added.
- **Accessibility built in.** Interactive components are built on Radix UI primitives (focus
  management, keyboard support, ARIA) or on native elements; every component is tested with
  Testing Library and axe-core, and the docs pass axe color-contrast checks in light and dark.

## 🚀 Quick start

Requirements: React 18 or 19, Tailwind CSS v4, and an import alias such as `@/*` in
`tsconfig.json` / `jsconfig.json` (Next.js sets this up for you; for Vite add `paths` to
`tsconfig.app.json` and `resolve.alias` to `vite.config.ts`).

```bash
npx slateui init          # detect your setup, write slateui.json, cn() and theme CSS
npx slateui add button dialog toast
```

```tsx
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "@/components/ui/toast";

export function SaveButton() {
  return <Button onClick={() => toast.success("Saved")}>Save</Button>;
}
// render <Toaster /> once near the root of your app
```

> The CLI is not published to npm from this repository. To use it locally: `pnpm install &&
pnpm build`, then run `node packages/cli/dist/index.js <command> --cwd path/to/app`.

## CLI reference

All commands accept `-c, --cwd <dir>` (defaults to the current directory).

### `slateui init`

Detects and records your project setup in `slateui.json`:

| Detected                | How                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework               | `next` dependency + `app/` or `src/app/` → `next-app`, otherwise `next-pages`; `vite` → `vite`                       |
| TypeScript / JavaScript | presence of `tsconfig.json` (JS projects get `.jsx` files with types stripped)                                       |
| Import alias            | `compilerOptions.paths` in tsconfig/jsconfig, following project `references` (Vite's `tsconfig.app.json`)            |
| Tailwind                | `tailwindcss` version in `package.json`; global CSS file (`src/app/globals.css`, `src/index.css`, …)                 |
| Package manager         | lockfile (`bun.lock(b)`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`), then `packageManager`, then user agent |

It then writes `lib/utils.ts` (the `cn()` helper), injects the theme tokens into your global
CSS between `/* slateui:theme:start */` markers (idempotent), and installs `clsx` and
`tailwind-merge`.

| Option                    | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `-y, --yes`               | accept detected defaults, never prompt                              |
| `-f, --force`             | overwrite an existing `slateui.json`                                |
| `-r, --registry <source>` | `bundled` (default), a local directory, or an `http(s)://` base URL |
| `--css <file>`            | global CSS file to inject the theme into                            |
| `--alias <prefix>`        | import alias prefix (`@`, `~`, `#`…)                                |
| `--no-install`            | skip installing npm dependencies                                    |

### `slateui add [components...]`

Copies components and, transitively, their `registryDependencies` (e.g. `form` pulls in
`label` and `utils`; cycles are detected and reported, not looped). Imports written as
`@/components/ui/x` and `@/lib/utils` in the registry are rewritten to your aliases,
`"use client"` is kept only for React Server Component frameworks (Next.js app router), and
missing npm dependencies are installed with your package manager.

| Option                    | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| `-a, --all`               | add every component                                     |
| `-y, --yes`               | never prompt; files you changed locally are **skipped** |
| `-o, --overwrite`         | replace files you changed locally                       |
| `-r, --registry <source>` | override the registry in `slateui.json`                 |
| `--no-install`            | skip installing npm dependencies                        |

Without `--yes`/`--overwrite` you are asked per modified file. Identical files are left untouched.

### `slateui diff [component]`

Compares your local files with the registry version (after alias rewriting, so only real
edits show). With a component name it prints a unified diff; without one it lists every
installed component that differs.

### `slateui list`

Lists the components in the registry, marking those already installed. `--json` for machine output.

### Registry sources

The registry is plain JSON produced by `pnpm --filter @slateui/registry build`:

```
registry/dist/index.json      # catalogue: names, files, dependencies, registryDependencies, theme CSS
registry/dist/r/<name>.json   # one item with full file contents
```

Point the CLI at it with `--registry ./path/to/registry` (the directory or its `dist/`), or
host the `dist` folder anywhere and use `--registry https://example.com/slateui`. The CLI
build also bundles a snapshot (`--registry bundled`, the default) so it works offline.

## Components

| Component     | Built on                       | Notes                                                                                                        |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Button        | native `<button>` + Radix Slot | `solid soft outline ghost danger link`, `sm md lg icon`, `loading`, `asChild`                                |
| Input         | native `<input>`               | `aria-invalid` styling                                                                                       |
| Label         | Radix Label                    |                                                                                                              |
| Textarea      | native `<textarea>`            |                                                                                                              |
| Checkbox      | Radix Checkbox                 | checked / unchecked / indeterminate                                                                          |
| Switch        | Radix Switch                   | `role="switch"`                                                                                              |
| Select        | Radix Select                   | groups, labels, separators, typeahead                                                                        |
| Dialog        | Radix Dialog                   | focus trap, Escape, scroll lock, focus restore                                                               |
| Dropdown Menu | Radix Dropdown Menu            | items, checkbox items, radio items, shortcuts, danger tone                                                   |
| Tooltip       | Radix Tooltip                  | opens on hover and keyboard focus                                                                            |
| Popover       | Radix Popover                  |                                                                                                              |
| Tabs          | Radix Tabs                     | automatic or manual activation                                                                               |
| Accordion     | Radix Accordion                | single / multiple, animated height                                                                           |
| Card          | native                         | configurable heading level                                                                                   |
| Badge         | native                         | `neutral brand success warning danger outline`                                                               |
| Alert         | native                         | `role="alert"` for danger, `role="status"` otherwise                                                         |
| Avatar        | Radix Avatar                   | image with fallback                                                                                          |
| Separator     | Radix Separator                | decorative by default                                                                                        |
| Skeleton      | native                         | `aria-hidden`                                                                                                |
| Toast         | dependency-free store          | `toast()`, `toast.success/warning/error/dismiss`, actions, auto-dismiss that pauses on hover/focus           |
| Table         | native table elements          | caption, header, footer, `scope` on headers                                                                  |
| Form          | context + Radix Slot           | `FormField`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`; works with any validation library |

## Theming

All colors are CSS variables with semantic names, mapped to Tailwind utilities via `@theme inline`:

| Token                                           | Utility examples              | Used for                        |
| ----------------------------------------------- | ----------------------------- | ------------------------------- |
| `--canvas` / `--ink`                            | `bg-canvas`, `text-ink`       | page background / text          |
| `--surface` / `--surface-ink`                   | `bg-surface`                  | cards, popovers, dialogs        |
| `--subtle` / `--subtle-ink`                     | `bg-subtle`                   | hover states, soft buttons      |
| `--muted-ink`                                   | `text-muted-ink`              | secondary text                  |
| `--edge` / `--field`                            | `border-edge`, `border-field` | dividers / form control borders |
| `--focus`                                       | `ring-focus`                  | focus rings                     |
| `--brand` / `--brand-ink`                       | `bg-brand text-brand-ink`     | primary actions                 |
| `--danger`, `--success`, `--warning` (+ `-ink`) | `bg-danger` …                 | status colors                   |
| `--radius`                                      | `rounded-md`, `rounded-lg` …  | corner radius scale             |

Light values live on `:root`; dark values on `.dark`. Toggle dark mode by adding the `dark`
class to `<html>` (the `dark:` variant is wired to it). Change the values in your CSS file to
re-brand — every component follows.

## Repository layout

```
registry/            component source (ui/, lib/), item metadata (items/*.json),
                     theme (styles/theme.css), build script, Vitest suites (tests/)
packages/cli/        the `slateui` CLI (TypeScript, commander) + unit/integration tests
apps/docs/           Vite docs/demo site + Playwright tests
e2e/                 end-to-end: scaffolds Vite and Next.js apps and builds them
docs/screenshots/    screenshots captured by the Playwright suite
```

## Development and tests

```bash
pnpm install
pnpm test            # everything below, in order
```

| Command             | What it runs                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`         | ESLint (typescript-eslint + react-hooks) across the monorepo                                                                                             |
| `pnpm format:check` | Prettier                                                                                                                                                 |
| `pnpm build`        | registry JSON → CLI (with bundled registry) → docs site                                                                                                  |
| `pnpm typecheck`    | `tsc` for every package                                                                                                                                  |
| `pnpm test:unit`    | Vitest: component suites (jsdom + Testing Library + axe-core) and CLI tests                                                                              |
| `pnpm test:e2e`     | create-vite and create-next-app scaffolds → `slateui init` → `slateui add --all` → `tsc --noEmit` → production build (needs npm registry access, ~2 min) |
| `pnpm test:browser` | Playwright (Chromium) against the production docs build                                                                                                  |

## Licence

[MIT](LICENSE)
