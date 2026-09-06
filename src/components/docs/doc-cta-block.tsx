import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Bottom-of-article CTA into StudyMap's own tools, not a fabricated product cross-sell. */
export function DocCtaBlock() {
  return (
    <div className="mt-10 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Ready to use what you just read?</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/map"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          Open the map
        </Link>
        <Link
          href="/calendar"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Check the calendar
        </Link>
        <Link
          href="/competitions"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Browse competitions
        </Link>
      </div>
    </div>
  );
}
