"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * The `pt-14` reserves space for the fixed navbar. The embeddable widget
 * (see /docs/embedding-widget) has no navbar, so it shouldn't pay for one.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname.startsWith("/embed");

  return (
    <main id="main-content" className={cn("flex flex-1 flex-col", !isEmbed && "pt-14")}>
      {children}
    </main>
  );
}
