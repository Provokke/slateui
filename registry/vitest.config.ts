import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\/(.*)$/, replacement: r("./ui/$1") },
      { find: /^@\/lib\/(.*)$/, replacement: r("./lib/$1") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    pool: "forks",
    poolOptions: { forks: { maxForks: 2, minForks: 1 } },
  },
});
