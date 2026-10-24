/**
 * StudyMap:src/lib/fonts.ts
 *
 * Self-hosted font setup for all three typefaces.
 * Each font injects a CSS variable onto <html> at build time.
 * Those variables are referenced in globals.css @theme inline:
 *   --font-sans    → var(--font-inter)
 *   --font-heading → var(--font-space-grotesk)
 *   --font-mono    → var(--font-jetbrains-mono)
 *
 * Usage in src/app/layout.tsx:
 *   import { inter, spaceGrotesk, jetbrainsMono } from "@/lib/fonts";
 *   ...
 *   <html className={[
 *     inter.variable,
 *     spaceGrotesk.variable,
 *     jetbrainsMono.variable,
 *   ].join(" ")}>
 *
 * The .woff2 files live in assets/fonts (SIL OFL, licenses alongside them) and
 * are the latin subsets Google Fonts serves, bundled as variable fonts so one
 * file covers every weight the app uses. They are deliberately NOT loaded with
 * next/font/google: Google Fonts intermittently answers with extensionless
 * `fonts.gstatic.com/l/font?kit=…&skey=…&v=…` URLs, which Next.js (both
 * webpack and Turbopack, vercel/next.js#99114) cannot resolve, failing the
 * production build at random. Self-hosting keeps `next build` off the network.
 */

import localFont from "next/font/local";

/**
 * Inter:body copy, UI labels, paragraph text.
 * Weights: 300 (light captions), 400 (body), 500 (semibold labels), 600 (strong labels).
 */
export const inter = localFont({
  src: "../../assets/fonts/Inter-Variable-latin.woff2",
  // Variable axis range. Static weights outside it would be synthesised by
  // the browser, which is why the range matches the weights actually used.
  weight: "300 600",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

/**
 * Space Grotesk:display headings and the wordmark.
 * Weights: 400 (subheadings), 500 (medium), 600 (card titles), 700 (h1/h2).
 * Tracking: -0.02em on h1, -0.01em on h2 (set in globals.css).
 */
export const spaceGrotesk = localFont({
  src: "../../assets/fonts/SpaceGrotesk-Variable-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-space-grotesk",
  display: "swap",
});

/**
 * JetBrains Mono:kickers, citation pills, freshness dates, map coordinates,
 * filter tags, and any ~/path-style UI cues.
 * Weights: 400 (default), 500 (emphasis), 600 (strong kickers).
 */
export const jetbrainsMono = localFont({
  src: "../../assets/fonts/JetBrainsMono-Variable-latin.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});
