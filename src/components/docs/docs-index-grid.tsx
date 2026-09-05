import Link from "next/link";

import { docsPages, DOCS_GROUPS } from "@/lib/docs-nav";
import { getDocMeta } from "@/lib/docs-meta";
import { Badge } from "@/components/ui/badge";

/**
 * Restoration of the original /docs index (an icon-card grid, replaced by
 * the vertical list in the redesign that added docs-index-list.tsx) as the
 * grid view option, grouped under DOCS_GROUPS headings to match the list.
 *
 * Cards in the same row come out equal height for free: each row is a CSS
 * grid track, and grid's default `align-items: stretch` sizes every card in
 * it to the tallest one - no explicit height needed.
 */
export function DocsIndexGrid() {
  return (
    <div className="flex flex-col gap-10">
      {DOCS_GROUPS.map((group) => {
        const entries = docsPages.filter((entry) => entry.group === group);
        if (entries.length === 0) return null;
        return (
          <div key={group}>
            <p className="kicker mb-3">{group}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {entries.map((entry) => {
                const { date, readTime } = getDocMeta(entry.href);
                const Icon = entry.icon;
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <Icon
                      className={`size-5 ${entry.iconClassName ?? "text-primary"}`}
                      aria-hidden="true"
                    />
                    <h2 className="font-heading font-semibold text-foreground leading-snug">
                      {entry.title}
                    </h2>
                    <p className="flex-1 text-sm text-muted-foreground">{entry.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{entry.group}</Badge>
                      {date && <time>{date}</time>}
                      <span>{readTime}</span>
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Read guide
                    </span>
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
