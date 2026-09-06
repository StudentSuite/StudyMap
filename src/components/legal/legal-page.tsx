import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";

interface LegalPageProps {
  title: string;
  updated?: string;
  children: ReactNode;
}

/**
 * Shared shell for the legal pages (privacy, terms, disclaimer): narrow
 * reading column, page title, optional last-updated stamp, and a stack of
 * LegalSection blocks separated by dividers.
 */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <PageContainer width="narrow">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      {updated ? (
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}.</p>
      ) : null}
      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </PageContainer>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-foreground/80">{children}</div>
    </section>
  );
}
