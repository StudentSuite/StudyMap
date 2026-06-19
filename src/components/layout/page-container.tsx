import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageWidth = "content" | "narrow";

const widths: Record<PageWidth, string> = {
  // Default content pages (docs, contribute, calendar).
  content: "max-w-4xl",
  // Legal/prose pages stay narrower for comfortable reading line length.
  narrow: "max-w-3xl",
};

interface PageContainerProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
}

/**
 * Single source of truth for content-page chrome: centered column, consistent
 * horizontal padding and vertical rhythm. Navbar/footer keep their own wider
 * max-w-6xl; this is for the readable body of a page.
 */
export function PageContainer({
  children,
  width = "content",
  className,
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-10", widths[width], className)}>
      {children}
    </div>
  );
}
