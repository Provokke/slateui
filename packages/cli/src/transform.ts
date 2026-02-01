import path from "node:path";
import ts from "typescript";
import type { Aliases } from "./config.js";

/** Rewrite the registry's canonical "@/..." imports to the project's aliases. */
export function rewriteImports(source: string, aliases: Aliases): string {
  return source.replace(
    /(\bfrom\s*|\bimport\s*|\bimport\(\s*)(["'])@\/([^"']+)\2/g,
    (_match, lead: string, quote: string, rest: string) => {
      return `${lead}${quote}${mapAlias(rest, aliases)}${quote}`;
    },
  );
}

function mapAlias(rest: string, aliases: Aliases): string {
  if (rest === "lib/utils") return aliases.utils;
  const rules: [string, string][] = [
    ["components/ui/", aliases.ui],
    ["components/", aliases.components],
    ["hooks/", aliases.hooks],
    ["lib/", aliases.lib],
  ];
  for (const [prefix, target] of rules) {
    if (rest.startsWith(prefix)) return `${target}/${rest.slice(prefix.length)}`;
  }
  // Unknown "@/x" path: keep its shape but swap the prefix.
  const prefix = aliases.ui.split("/")[0];
  return `${prefix}/${rest}`;
}

export function stripUseClient(source: string): string {
  return source.replace(/^\s*["']use client["'];?\s*\n+/, "");
}

/** Strip TypeScript types for JavaScript projects, keeping JSX intact. */
export function toJavaScript(source: string, fileName: string): string {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      verbatimModuleSyntax: false,
      removeComments: false,
    },
  });
  return result.outputText.replace(/\n\/\/# sourceMappingURL=.*$/, "");
}

export function jsFileName(file: string): string {
  return file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");
}

export interface TransformOptions {
  aliases: Aliases;
  tsx: boolean;
  rsc: boolean;
}

export function transformFile(
  file: { path: string; content: string },
  options: TransformOptions,
): { path: string; content: string } {
  let content = rewriteImports(file.content, options.aliases);
  if (!options.rsc) content = stripUseClient(content);
  let filePath = file.path;
  if (!options.tsx) {
    content = toJavaScript(content, path.basename(file.path));
    filePath = jsFileName(file.path);
  }
  return { path: filePath, content };
}
