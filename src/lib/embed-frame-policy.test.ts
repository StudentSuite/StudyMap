import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// Guards the /embed carve-out reviewed in #311: it is the one route other sites may frame, so
// it must not grow account state, and its framing headers must not contradict each other.

const require = createRequire(import.meta.url);
const root = path.resolve(__dirname, "../..");
const nextConfig = require("../../next.config.js") as {
  headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
};

const headerNames = (rule: { headers: { key: string }[] }) =>
  rule.headers.map((h) => h.key.toLowerCase());

/** Does a Next.js `source` pattern like `/((?!embed(?:/|$)).*)` match `pathname`? */
function matchesBlanket(source: string, pathname: string) {
  const inner = source.replace(/^\//, "");
  return new RegExp(`^${inner}$`).test(pathname.replace(/^\//, ""));
}

describe("next.config.js framing headers", () => {
  it("denies framing everywhere except /embed", async () => {
    const rules = await nextConfig.headers();
    const blanket = rules.find((r) => headerNames(r).includes("x-frame-options"));

    expect(blanket).toBeDefined();
    expect(blanket!.headers.find((h) => h.key === "X-Frame-Options")?.value).toBe("DENY");

    for (const pathname of [
      "/",
      "/map",
      "/login",
      "/docs/embedding-widget",
      "/embedded-things",
    ]) {
      expect(matchesBlanket(blanket!.source, pathname), pathname).toBe(true);
    }
    for (const pathname of ["/embed", "/embed/anything"]) {
      expect(matchesBlanket(blanket!.source, pathname), pathname).toBe(false);
    }
  });

  it("lets /embed be framed with frame-ancestors only, never together with X-Frame-Options", async () => {
    const rules = await nextConfig.headers();
    const embed = rules.find((r) => r.source === "/embed/:path*");

    expect(embed).toBeDefined();
    expect(embed!.headers.find((h) => h.key === "Content-Security-Policy")?.value).toBe(
      "frame-ancestors *",
    );
    expect(headerNames(embed!)).not.toContain("x-frame-options");
  });
});

describe("/embed renders no account state", () => {
  const files = [
    "src/app/embed/page.tsx",
    "src/components/map/embed-map.tsx",
    "src/components/map/embed-widget.tsx",
  ];

  it.each(files)("%s does not touch Supabase, auth or user data", (file) => {
    const source = readFileSync(path.join(root, file), "utf8");
    const imports = source
      .split("\n")
      .filter(
        (line) =>
          /^\s*(import|export)\b.*\bfrom\b/.test(line) || /^\s*import\s+["']/.test(line),
      )
      .join("\n");

    expect(imports).not.toMatch(/supabase/i);
    expect(imports).not.toMatch(
      /\bauth\b|AuthProvider|use-user|user-places|user-profile/i,
    );
  });
});
