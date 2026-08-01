import type { Metadata } from "next";
import Link from "next/link";

import { docsPages } from "@/lib/docs-nav";

export const metadata: Metadata = {
  title: "Docs",
  description: "Student guides for StudyMap and the tools around it.",
};

export default function DocsIndexPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {docsPages.map(({ href, title, description, icon: Icon, iconClassName }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
        >
          <Icon className={`size-5 ${iconClassName ?? "text-primary"}`} aria-hidden="true" />
          <h2 className="font-heading font-semibold text-foreground leading-snug">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <span className="mt-1 text-sm font-medium text-primary group-hover:underline">
            Read guide
          </span>
        </Link>
      ))}
    </div>
  );
}
