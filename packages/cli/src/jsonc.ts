/**
 * Parse JSON with comments and trailing commas (tsconfig.json style).
 * Comment markers inside strings (e.g. "@/*") are preserved.
 */
export function parseJsonc<T = unknown>(text: string): T {
  let out = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i++;
    } else if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
    } else {
      out += ch;
      i++;
    }
  }
  // Remove trailing commas outside strings.
  let cleaned = "";
  inString = false;
  for (let j = 0; j < out.length; j++) {
    const ch = out[j];
    if (inString) {
      cleaned += ch;
      if (ch === "\\") {
        cleaned += out[++j] ?? "";
      } else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    if (ch === ",") {
      let k = j + 1;
      while (k < out.length && /\s/.test(out[k])) k++;
      if (out[k] === "}" || out[k] === "]") continue;
    }
    cleaned += ch;
  }
  return JSON.parse(cleaned.replace(/^\uFEFF/, "")) as T;
}
