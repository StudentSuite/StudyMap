import generated from "./docs-meta.generated.json";

export interface DocMeta {
  date: string;
  readTime: string;
}

const meta = generated as Record<string, DocMeta>;

const FALLBACK: DocMeta = { date: "", readTime: "1 min read" };

/** Reads scripts/build-docs-meta.mjs's build-time output. Falls back safely for a route added since the last regeneration. */
export function getDocMeta(href: string): DocMeta {
  return meta[href] ?? FALLBACK;
}
