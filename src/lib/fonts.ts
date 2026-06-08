/**
 * StudyMap — src/lib/fonts.ts
 *
 * next/font/google setup for all three typefaces.
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
 */

import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

/**
 * Inter — body copy, UI labels, paragraph text.
 * Weights: 300 (light captions), 400 (body), 500 (semibold labels), 600 (strong labels).
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

/**
 * Space Grotesk — display headings and the wordmark.
 * Weights: 400 (subheadings), 500 (medium), 600 (card titles), 700 (h1/h2).
 * Tracking: -0.02em on h1, -0.01em on h2 (set in globals.css).
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * JetBrains Mono — kickers, citation pills, freshness dates, map coordinates,
 * filter tags, and any ~/path-style UI cues.
 * Weights: 400 (default), 500 (emphasis), 600 (strong kickers).
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});
