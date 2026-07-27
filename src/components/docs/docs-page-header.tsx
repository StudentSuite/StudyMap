import type { ReactNode } from "react";
import Link from "next/link";

interface DocsPageHeaderProps {
  title: string;
  description: ReactNode;
  /** Guide title shown after "Docs /" in the kicker. Omit on the docs index itself. */
  breadcrumbLabel?: string;
}

/**
 * Full-bleed header band shared by every /docs page: a graph-paper texture
 * strip (same motif as the homepage hero, faded out toward the bottom) behind
 * a kicker + H1 + intro paragraph. Brings docs visually in line with
 * Home/About instead of the plain unstyled card stack it used to be.
 */
export function DocsPageHeader({ title, description, breadcrumbLabel }: DocsPageHeaderProps) {
  return (
    <div className="relative isolate overflow-hidden border-b border-border">
      <div
        className="graph-paper absolute inset-0 -z-10"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="kicker">
          {breadcrumbLabel ? (
            <>
              <Link href="/docs" className="transition-colors hover:text-foreground">
                Docs
              </Link>
              <span className="mx-1.5 text-muted-foreground/50">/</span>
              {breadcrumbLabel}
            </>
          ) : (
            "Docs"
          )}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
