"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { docsPages, DOCS_GROUPS } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function DocsNavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6">
      {DOCS_GROUPS.map((group) => {
        const items = docsPages.filter((entry) => entry.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="kicker mb-2">{group}</p>
            <ul className="flex flex-col gap-0.5">
              {items.map((entry) => {
                const active = pathname === entry.href;
                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {entry.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Persistent left sidebar, desktop only (lg+). */
export function DocsDesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-56 lg:shrink-0 lg:pt-10">
      <div className="sticky top-20">
        <DocsNavList pathname={pathname} />
      </div>
    </aside>
  );
}

/** Full-width "Docs menu" trigger + Sheet drawer, mobile only (below lg). */
export function DocsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
          <Menu className="size-4" aria-hidden="true" />
          Docs menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetTitle className="px-4 pt-4">Docs</SheetTitle>
        <div className="mt-2 px-2 pb-4">
          <DocsNavList pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
