"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { docsPages } from "@/lib/docs-nav";

/** Prev/next link pair at the bottom of a doc page. Renders nothing on the /docs index. */
export function DocsPager() {
  const pathname = usePathname();
  const index = docsPages.findIndex((entry) => entry.href === pathname);
  if (index === -1) return null;

  const prev = docsPages[index - 1];
  const next = docsPages[index + 1];
  if (!prev && !next) return null;

  return (
    <nav className="mt-10 flex items-stretch gap-4 border-t border-border pt-6" aria-label="Doc navigation">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-1 flex-col gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/50 hover:bg-muted/40 sm:text-left"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:flex-row-reverse sm:justify-end">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Previous
          </span>
          <span className="font-medium text-foreground">{prev.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-1 flex-col items-end gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Next
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="font-medium text-foreground">{next.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
