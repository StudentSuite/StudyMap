import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The brand typeface for Open Graph cards.
 *
 * next/og runs on the edge runtime, where there is no system font to rely
 * on, so a font must always be registered explicitly. Space Grotesk in
 * TrueType is bundled under assets/fonts (SIL OFL) and read from disk at
 * build time: these cards are static, so the read runs in Node during
 * "next build" and cannot hit the network. The Google Fonts download is
 * only a fallback for the on-demand edge case where the filesystem is not
 * readable. JSON-free interface so callers can build the ImageResponse
 * `fonts` option directly.
 */

export interface HeadingFont {
  data: ArrayBuffer;
  weight: 400 | 700;
}

const FONT_DIR = join(process.cwd(), "assets", "fonts");

const FONT_FILES: { weight: 400 | 700; file: string }[] = [
  { weight: 400, file: "SpaceGrotesk-Regular.ttf" },
  { weight: 700, file: "SpaceGrotesk-Bold.ttf" },
];

/** Reads a bundled TTF, or null when the file is missing (e.g. an edge render). */
function readFont(weight: 400 | 700): ArrayBuffer | null {
  try {
    const file = FONT_FILES.find((f) => f.weight === weight)?.file;
    if (!file) return null;
    const buf = readFileSync(join(FONT_DIR, file));
    // Hand over a detached view of the buffer so satori can borrow it for
    // the lifetime of the rendered card.
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

/**
 * Google Fonts fallback: request the CSS with a legacy user-agent so Google
 * returns truetype URLs, the only format the image renderer reads. Each font
 * carries the weight parsed from its own @font-face block.
 */
async function fetchFromGoogleFonts(): Promise<HeadingFont[] | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap",
      { headers: { "User-Agent": "Mozilla/4.0" } },
    ).then((response) => response.text());
    const byWeight = new Map<400 | 700, ArrayBuffer>();
    for (const block of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
      const url = block[1].match(
        /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/,
      )?.[1];
      const weight = Number(block[1].match(/font-weight:\s*(\d+)/)?.[1]);
      if (!url || (weight !== 400 && weight !== 700)) continue;
      if (byWeight.has(weight)) continue;
      byWeight.set(weight, await fetch(url).then((response) => response.arrayBuffer()));
    }
    return byWeight.size
      ? Array.from(byWeight, ([weight, data]) => ({ data, weight }))
      : null;
  } catch {
    return null;
  }
}

let headingFontPromise: Promise<HeadingFont[]> | null = null;

/**
 * Loads the heading font(s). Local files first, network as a fallback;
 * cached for the process lifetime (the build, for these static pages).
 * Only throws if both sources produce nothing, which cannot happen while the
 * bundled TTFs are present in the repository.
 */
export function loadHeadingFonts(): Promise<HeadingFont[]> {
  if (!headingFontPromise) {
    headingFontPromise = (async () => {
      const fromDisk: HeadingFont[] = FONT_FILES.flatMap(({ weight }) => {
        const data = readFont(weight);
        return data ? [{ data, weight }] : [];
      });
      if (fromDisk.length > 0) return fromDisk;
      return (await fetchFromGoogleFonts()) ?? [];
    })();
  }
  return headingFontPromise;
}
