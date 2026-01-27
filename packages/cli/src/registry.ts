import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./logger.js";

export interface IndexItem {
  name: string;
  type: "ui" | "lib" | "hook";
  description?: string;
  files: string[];
  dependencies: string[];
  registryDependencies: string[];
}

export interface RegistryIndex {
  name: string;
  version: string;
  theme: { css: string };
  items: IndexItem[];
}

export interface RegistryItem extends Omit<IndexItem, "files"> {
  files: { path: string; content: string }[];
}

export interface Registry {
  source: string;
  getIndex(): Promise<RegistryIndex>;
  getItem(name: string): Promise<RegistryItem>;
}

export function bundledRegistryPath(): string {
  // dist/registry.js -> dist/registry ; src/registry.ts (tests) -> ../../registry/dist
  const here = path.dirname(fileURLToPath(import.meta.url));
  const bundled = path.join(here, "registry");
  if (existsSync(path.join(bundled, "index.json"))) return bundled;
  return path.resolve(here, "../../../registry/dist");
}

const isUrl = (s: string) => /^https?:\/\//i.test(s);

/** Create a registry reader for "bundled", a local directory, or an http(s) base URL. */
export function createRegistry(source: string, cwd = process.cwd()): Registry {
  if (isUrl(source)) {
    const base = source.replace(/\/index\.json$/, "").replace(/\/+$/, "");
    const get = async <T>(url: string): Promise<T> => {
      let res: Response;
      try {
        res = await fetch(url);
      } catch (error) {
        throw new CliError(`Could not reach registry at ${url}: ${(error as Error).message}`);
      }
      if (!res.ok) throw new CliError(`Registry request failed: ${res.status} ${url}`);
      return (await res.json()) as T;
    };
    let index: Promise<RegistryIndex> | undefined;
    return {
      source,
      getIndex: () => (index ??= get<RegistryIndex>(`${base}/index.json`)),
      getItem: (name) => get<RegistryItem>(`${base}/r/${encodeURIComponent(name)}.json`),
    };
  }

  let dir = source === "bundled" ? bundledRegistryPath() : path.resolve(cwd, source);
  if (dir.endsWith("index.json")) dir = path.dirname(dir);
  if (!existsSync(path.join(dir, "index.json")) && existsSync(path.join(dir, "dist/index.json"))) {
    dir = path.join(dir, "dist");
  }
  const read = <T>(file: string): T => {
    const full = path.join(dir, file);
    if (!existsSync(full)) throw new CliError(`Registry file not found: ${full}`);
    return JSON.parse(readFileSync(full, "utf8")) as T;
  };
  return {
    source,
    getIndex: async () => read<RegistryIndex>("index.json"),
    getItem: async (name) => {
      if (!/^[a-z0-9-]+$/.test(name)) throw new CliError(`Invalid component name "${name}"`);
      return read<RegistryItem>(path.join("r", `${name}.json`));
    },
  };
}
