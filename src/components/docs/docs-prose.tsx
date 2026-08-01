import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DocsProseProps {
  children: ReactNode;
  className?: string;
}

/**
 * Comfortable article typography for doc body content: capped line length,
 * generous vertical rhythm, headings in the heading font. Hand-rolled
 * descendant utilities rather than @tailwindcss/typography (not installed;
 * the plugin's default scale would fight the amber/zinc CSS-var tokens
 * already set up here).
 */
export function DocsProse({ children, className }: DocsProseProps) {
  return (
    <div
      className={cn(
        "max-w-[70ch]",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground first:[&_h2]:mt-0",
        "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:leading-relaxed [&_p]:text-foreground/80",
        "[&>p+p]:mt-4",
        "[&_ul]:my-3 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-foreground/80",
        "[&_ol]:my-3 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:text-foreground/80",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:hover:underline",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        className,
      )}
    >
      {children}
    </div>
  );
}
