import Link from "next/link";

import { docsPages, DOCS_GROUPS } from "@/lib/docs-nav";
import { getDocMeta } from "@/lib/docs-meta";
import { Badge } from "@/components/ui/badge";

/**
 * Vertical list, not the old icon-card grid (see docs-index-grid.tsx for
 * that): group heading, then per entry a group tag + date + read time +
 * title + excerpt. Grouped under DOCS_GROUPS headings so both this and the
 * grid view agree on topic order (see src/lib/docs-nav.ts).
 */
export function DocsIndexList() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      {DOCS_GROUPS.map((group) => {
        const entries = docsPages.filter((entry) => entry.group === group);
        if (entries.length === 0) return null;
        return (
          <div key={group}>
            <p className="kicker mb-3">{group}</p>
            <div className="flex flex-col divide-y divide-border">
              {entries.map((entry) => {
                const { date, readTime } = getDocMeta(entry.href);
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="group flex flex-col gap-2 py-6 first:pt-0"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {entry.group && <Badge variant="secondary">{entry.group}</Badge>}
                      {date && <time>{date}</time>}
                      <span>{readTime}</span>
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {entry.title}
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {entry.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
