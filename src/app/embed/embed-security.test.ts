import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

// /embed is the one route any site may iframe (next.config.js). That is only
// safe while the route shows public map data and nothing account-aware, so
// these tests fail the moment either half of that changes (#311).

const require = createRequire(import.meta.url);
const root = path.resolve(__dirname, "../../..");
const nextConfig = require(path.join(root, "next.config.js"));

type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };

// Next.js sources are path-to-regexp patterns. The two used here are a raw
// regex group and a `:path*` suffix, so this converts just those shapes.
function matches(source: string, pathname: string): boolean {
  const pattern = source.startsWith("/(")
    ? source
    : source.replace("/:path*", "(?:/.*)?");
  return new RegExp(`^${pattern}$`).test(pathname);
}

describe("/embed framing headers", () => {
  it("frames /embed with frame-ancestors only, never X-Frame-Options", async () => {
    const rules: Rule[] = await nextConfig.headers();
    for (const pathname of ["/embed", "/embed/anything"]) {
      const keys = rules
        .filter((r) => matches(r.source, pathname))
        .flatMap((r) => r.headers.map((h) => h.key));
      expect(keys).toContain("Content-Security-Policy");
      expect(keys).not.toContain("X-Frame-Options");
    }
  });

  it("keeps X-Frame-Options: DENY on every other route", async () => {
    const rules: Rule[] = await nextConfig.headers();
    for (const pathname of [
      "/",
      "/map",
      "/account",
      "/docs/embedding-widget",
      "/embedded",
    ]) {
      const headers = rules
        .filter((r) => matches(r.source, pathname))
        .flatMap((r) => r.headers);
      expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
      expect(headers.map((h) => h.key)).not.toContain("Content-Security-Policy");
    }
  });
});

describe("/embed renders no account state", () => {
  const files = ["src/app/embed/page.tsx", "src/components/map/embed-map.tsx"];
  const forbidden = [
    /supabase/i,
    /next\/headers/,
    /\bcookies\(/,
    /\bauth\b/i,
    /localStorage/,
  ];

  for (const file of files) {
    it(`${file} touches no session, cookie, or auth API`, () => {
      const source = readFileSync(path.join(root, file), "utf8");
      for (const re of forbidden) {
        expect(
          source,
          `${file} matches ${re}; review the /embed framing carve-out first (#311)`,
        ).not.toMatch(re);
      }
    });
  }
});
