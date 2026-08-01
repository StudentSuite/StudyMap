import { codeToHtml } from "shiki";

/**
 * Renders code to highlighted HTML at build/render time (server only - shiki's
 * WASM grammar engine never ships to the client). Dual light/dark theme via
 * CSS variables, toggled by the existing `.dark` class in code-block.tsx's
 * companion CSS rule in globals.css.
 */
export function highlightCode(code: string, lang: string) {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
