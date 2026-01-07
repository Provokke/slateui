export const THEME_START = "/* slateui:theme:start */";
export const THEME_END = "/* slateui:theme:end */";

/**
 * Insert (or replace) the slateui theme block in a Tailwind v4 stylesheet.
 * Ensures `@import "tailwindcss";` is present and comes first.
 */
export function injectTheme(existing: string, themeCss: string): string {
  const block = `${THEME_START}\n${themeCss.trim()}\n${THEME_END}`;
  let css = existing;
  const start = css.indexOf(THEME_START);
  const end = css.indexOf(THEME_END);
  if (start !== -1 && end !== -1) {
    return css.slice(0, start) + block + css.slice(end + THEME_END.length);
  }
  const importRe = /@import\s+(["'])tailwindcss\1[^;]*;\s*\n?/;
  const match = importRe.exec(css);
  if (match) {
    const at = match.index + match[0].length;
    return (
      `${css.slice(0, at).trimEnd()}\n\n${block}\n\n${css.slice(at).trimStart()}`.trimEnd() + "\n"
    );
  }
  css = css.trim();
  return `@import "tailwindcss";\n\n${block}\n${css ? `\n${css}\n` : ""}`;
}
