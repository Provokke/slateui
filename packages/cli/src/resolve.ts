import { CliError } from "./logger.js";

export interface Resolvable {
  name: string;
  registryDependencies: string[];
}

export interface Resolution {
  /** Every item needed, dependencies before dependents. */
  order: string[];
  /** Dependency cycles encountered (each as a path, e.g. ["a", "b", "a"]). */
  cycles: string[][];
}

/**
 * Resolve registryDependencies transitively with a depth-first walk.
 * Cycles do not loop forever: the back-edge is recorded and skipped.
 */
export function resolveTree(items: Resolvable[], requested: string[]): Resolution {
  const byName = new Map(items.map((i) => [i.name, i]));
  const state = new Map<string, "visiting" | "done">();
  const order: string[] = [];
  const cycles: string[][] = [];

  const visit = (name: string, trail: string[]) => {
    const current = state.get(name);
    if (current === "done") return;
    if (current === "visiting") {
      cycles.push([...trail.slice(trail.indexOf(name)), name]);
      return;
    }
    const item = byName.get(name);
    if (!item) {
      const via = trail.length ? ` (required by "${trail[trail.length - 1]}")` : "";
      const hint = suggest(name, [...byName.keys()]);
      throw new CliError(
        `Unknown component "${name}"${via}.${hint ? ` Did you mean "${hint}"?` : ""}`,
      );
    }
    state.set(name, "visiting");
    for (const dep of item.registryDependencies) visit(dep, [...trail, name]);
    state.set(name, "done");
    order.push(name);
  };

  for (const name of requested) visit(name, []);
  return { order, cycles };
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

export function suggest(name: string, candidates: string[]): string | null {
  let best: string | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const d = distance(name, c);
    if (d < bestScore) {
      best = c;
      bestScore = d;
    }
  }
  return bestScore <= Math.max(2, Math.floor(name.length / 3)) ? best : null;
}
