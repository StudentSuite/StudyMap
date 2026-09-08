#!/usr/bin/env node
/** Audit competition logos for #226 using sharp.

This script reads every PNG in `public/competitions/`, extracts its pixel
dimensions, and reports how many are under ~128px on their long edge. It uses
`sharp` since the repo already depends on it and it parses local files without
hitting the network.
*/

import { readFileSync, readdirSync } from "node:fs";
import sharp from "sharp";

const base = "public/competitions";
const files = readdirSync(base);
const rows = [];

for (const name of files) {
  if (!name.endsWith(".png")) continue;
  const buf = readFileSync(`${base}/${name}`);
  const { width, height } = await sharp(buf).metadata();
  const w = width ?? -1;
  const h = height ?? -1;
  rows.push({
    name,
    w,
    h,
    bytes: buf.length,
    small: Math.min(w, h) < 128,
  });
}

rows.sort((a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h));

let smallCount = 0;
for (const r of rows) {
  if (r.small) smallCount++;
  console.log(
    `${r.name.padEnd(52)} ${String(r.w).padStart(5)}x${String(r.h).padStart(5)}  ${r.bytes}B` +
      (r.small ? "  <-- under ~128 long edge" : ""),
  );
}

console.log("");
console.log(`total pngs: ${rows.length}; under ~128 long edge: ${smallCount}`);
