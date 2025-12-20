import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 20 * 60_000,
    hookTimeout: 20 * 60_000,
    // Scaffolding + installs + production builds are heavy: run apps one at a time.
    fileParallelism: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
