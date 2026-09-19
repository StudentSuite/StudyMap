// Refreshes competition logo PNGs in public/competitions to a quality that
// survives the card banner: any record whose current logo is missing or under
// ~128px on the long edge is re-fetched at a larger size.
//
// Strategy, per competition:
//   1. A curated OVERRIDES map (id -> ordered candidate URLs). This is where
//      researched, known-good logo URLs for tricky sites live.
//   2. Otherwise probe the record's official domain for the standard touch
//      icon / android-chrome asset paths, which are real logo marks at
//      180px+, unlike favicon.ico.
//
// The first candidate that yields a readable raster at or above the size bar
// (128px, preferring 256px+) wins. Every accepted asset is converted to a
// transparent-background PNG, trimmed of whitespace, and centered on a 512x512
// transparent canvas so all cards render uniformly via object-contain.
//
// Idempotent: already-fine logos are never overwritten. Usage:
//   node scripts/refresh-competition-logos.mjs [--overwrite]
// --overwrite re-fetches every record even when the current logo already
// clears the size bar.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const DATA_DIR = process.argv.includes("--data-dir")
  ? resolve(process.argv[process.argv.indexOf("--data-dir") + 1])
  : join(ROOT, "data", "competitions");
const OUT_DIR = join(ROOT, "public", "competitions");
const OVERWRITE = process.argv.includes("--overwrite");
const MAX_EDGE = 512;
const SIZE_BAR = 128;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Curated, researched logo URLs in priority order. Prefer a mark over a
// cover photo; the picker scores square-ish images highly and rejects
// anything it cannot rasterize at the size bar.
const OVERRIDES = {
  // Researched, known-good logo URLs in priority order (best first).
  "international-olympiad-in-informatics": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/IOI_logo.png/960px-IOI_logo.png",
  ],
  "world-scholars-cup": [
    "https://upload.wikimedia.org/wikipedia/en/a/af/WSC_Logo_notext.png",
  ],
  "ayn-rand-institute-essay-contests": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Ari_logo_header.png/960px-Ari_logo_header.png",
  ],
  // Official brand mark from the org's own site.
  envirothon: [
    "https://envirothon.org/wp-content/uploads/2022/02/Envirothon-logo-Registered143x.png",
  ],
  hmmt: ["https://hmmt-prod.s3.amazonaws.com/static/img/logo/hmmt/logo.png"],
  "tournament-of-the-towns": ["https://www.turgor.ru/i/logo.gif"],
  "ja-company-of-the-year": [
    "https://cdn.worldvectorlogo.com/logos/junior-achievement.svg",
  ],
  "ja-stock-market-challenge": [
    "https://cdn.worldvectorlogo.com/logos/junior-achievement.svg",
  ],
  "questbridge-national-college-match": [
    "https://www.questbridge.org/apple-touch-icon.png",
  ],
  "mit-think": ["https://think.mit.edu/images/blinker.svg"],
  "nsda-national-tournament": [
    // Only white-on-transparent colorways are hosted; skip (checked by hand:
    // the RGB option renders as a near-blank frame).
    "https://www.speechanddebate.org/wp-content/uploads/NSDA-Logo-RGB.png",
    "https://www.speechanddebate.org/wp-content/uploads/NSDA-Logo-RGB-REVERSED.png",
  ],
  "certamen-nlc": [
    // NLE's own 192px favicon is a clean brand mark.
    "https://www.nle.org/favicon.ico",
  ],
  "congressional-art-competition": [
    // The official seal of the U.S. House, which runs the program.
    "https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_the_United_States_House_of_Representatives.svg",
  ],
  "bennington-young-writers-awards": [
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Bennington_College_logo.jpg",
  ],
};

const STATIC_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-152x152.png",
  "/android-chrome-512x512.png",
  "/android-chrome-192x192.png",
  "/favicon-512x512.png",
  "/favicon-192x192.png",
];

function log(rec, msg) {
  console.log(`${msg}  (${rec.id})`);
}

async function fetchBuffer(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "image/*,*/*;q=0.8" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return null; // too small to be a real logo
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "text/html,*/*;q=0.5" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Follow a homepage's icon links to the real asset URLs instead of guessing
// standard paths (most sites host icons on a CDN now). Returns URL, highest
// sizes first; falls back to og:image as a last resort.
async function discoverAssets(baseUrl) {
  const html = await fetchText(baseUrl);
  if (!html) return [];
  const hrefs = [];
  const links = [...html.matchAll(/<link\b[^>]*>/gi)];
  for (const m of links) {
    const tag = m[0];
    const rel = (tag.match(/rel\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").toLowerCase();
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    const sizes = (tag.match(/sizes\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").match(
      /^(\d+)x(\d+)$/,
    );
    if (!rel.includes("icon") || !href) continue;
    const { width = 0, height = 0 } = sizes
      ? { width: +sizes[1], height: +sizes[2] }
      : {};
    hrefs.push({ href, width, height, kind: rel.includes("apple") ? "apple" : "icon" });
  }
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)];
  for (const m of metas) {
    const name = (m[0].match(/name\s*=\s*["']([^"']+)["']/i)?.[1] ?? "").toLowerCase();
    const content = m[0].match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if ((name === "msapplication-tileimage" || name === "twitter:image") && content) {
      hrefs.push({ href: content, width: 144, height: 144, kind: "icon" });
    }
  }
  const og = html.match(
    /<meta\b[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i,
  );
  if (og) hrefs.push({ href: og[1], width: 0, height: 0, kind: "og" });

  const resolved = hrefs
    .map((h) => {
      try {
        return { url: new URL(h.href, baseUrl).href, ...h };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((h) => !h.url.startsWith("data:"));
  // Prefer brand marks over og covers, then larger declared sizes.
  resolved.sort(
    (a, b) => (a.kind === "og" ? 1 : 0) - (b.kind === "og" ? 1 : 0) || b.width - a.width,
  );
  return resolved.map((h) => h.url);
}

async function sizeOf(buf) {
  try {
    const meta = await sharp(buf).metadata();
    return { w: meta.width, h: meta.height };
  } catch {
    return null;
  }
}

// A file can clear the size bar yet be a visually empty canvas (all-alpha) or
// a near-solid white tile, which is worse than a small-but-real mark. Detect
// both by sampling alpha coverage on a small downscale.
async function isBlankPng(buf) {
  try {
    const { data, info } = await sharp(buf)
      .resize(48)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const n = info.width * info.height;
    let vis = 0;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) {
        vis++;
        sum += data[i] + data[i + 1] + data[i + 2];
      }
    }
    const ratio = vis / n;
    if (ratio < 0.05) return true; // essentially an empty canvas
    const mean = vis ? sum / (vis * 3) : 0;
    if (ratio > 0.7 && mean > 245) return true; // near-solid white tile
    return false;
  } catch {
    return false;
  }
}

// Lower is better. Square-ish large marks outrank wide covers.
function score(w, h) {
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  const squareness = short / long;
  return long < SIZE_BAR ? Infinity : 1e9 - long * 10 - squareness * 1e6;
}

async function convertToPng(buf, outFile) {
  let resized;
  try {
    resized = await sharp(buf)
      .rotate()
      .trim()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();
  } catch {
    // A fully transparent frame refuses to trim; fall back to untrimmed.
    resized = await sharp(buf)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();
  }
  const { width, height } = await sharp(resized).metadata();
  const canvas = sharp({
    create: {
      width: MAX_EDGE,
      height: MAX_EDGE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  const composed = await canvas
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toBuffer();
  writeFileSync(outFile, composed);
  return { width, height };
}

async function tryAssets(rec, urls) {
  const loaded = [];
  for (const url of urls) {
    if (!url) continue;
    const buf = await fetchBuffer(url);
    if (!buf) continue;
    const sz = await sizeOf(buf);
    if (!sz) continue;
    loaded.push({ url, buf, s: score(sz.w, sz.h) });
  }
  if (!loaded.length) return null;
  loaded.sort((a, b) => a.s - b.s);
  for (const cand of loaded) {
    // A candidate that is itself an empty canvas or solid-white tile (see
    // isBlankPng) is never an upgrade, no matter how large.
    if (await isBlankPng(cand.buf)) continue;
    const dims = await convertToPng(cand.buf, join(OUT_DIR, `${rec.id}.png`));
    return { url: cand.url, w: dims.width, h: dims.height };
  }
  return null;
}

const fileNames = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

async function main() {
  const list = [];
  for (const fn of fileNames) {
    const recs = JSON.parse(readFileSync(join(DATA_DIR, fn), "utf8"));
    for (const r of recs) list.push(r);
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const workers = Math.min(8, list.length);
  let idx = 0;

  async function worker() {
    while (idx < list.length) {
      const rec = list[idx++];
      const outFile = join(OUT_DIR, `${rec.id}.png`);
      let size = null;
      if (!OVERWRITE && existsSync(outFile)) {
        size = await sizeOf(readFileSync(outFile));
      }
      if (
        size &&
        Math.max(size.w, size.h) >= SIZE_BAR &&
        !(await isBlankPng(readFileSync(outFile)))
      ) {
        log(rec, "SKIP  already fine");
        skipped++;
        continue;
      }
      const siteFor = [rec.official_url, rec.organizer_url]
        .map((u) => {
          try {
            return u ? new URL(u) : null;
          } catch {
            return null;
          }
        })
        .find(Boolean);
      const domainOf = siteFor ? siteFor.hostname.replace(/^www\./, "") : null;
      // A competition hosted on a deep path of someone else's domain (e.g.
      // filmfreeway.com/festival/x, mlh.io/seasons/...) has no favicon of its
      // own; the Google favicon for that host would be the host's mark, not the
      // competition's, so never fall back to it there.
      const deepHostPath =
        siteFor &&
        siteFor.pathname.replace(/\/+$/, "").split("/").filter(Boolean).length > 1;
      const override = OVERRIDES[rec.id];
      const discovered = domainOf ? await discoverAssets(`https://${domainOf}/`) : [];
      const candidates = [
        ...(override ?? []),
        ...((override ?? []).length
          ? []
          : [
              ...STATIC_PATHS.map((p) => `https://${domainOf}${p}`),
              ...discovered,
              // Last resort: the site's favicon at 256px. It is the same mark
              // a site already ships, so never wrong content, and at 256px it
              // clears the size bar without the 10-20x stretch that pixelated
              // the old 16-48px copies.
              ...(domainOf && !deepHostPath
                ? [
                    `https://www.google.com/s2/favicons?domain=${domainOf}&sz=256`,
                    `https://www.google.com/s2/favicons?domain=${domainOf}&sz=512`,
                  ]
                : []),
            ]),
      ];
      const got = await tryAssets(rec, candidates);
      if (got) {
        console.log(`OK   ${rec.id}  ${got.w}x${got.h}  <- ${got.url}`);
        updated++;
      } else {
        log(rec, "FAIL (no candidate asset found)");
        failed++;
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, worker));

  console.log(
    `\ndone: ${updated} updated, ${skipped} skipped (already fine), ${failed} failed`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
