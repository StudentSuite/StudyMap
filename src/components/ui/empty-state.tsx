import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * A designed "nothing here" state: centered icon, a clear one-line title,
 * optional supporting copy, and an optional action - used anywhere a list or
 * grid can come up empty (competition browser, map results, calendar
 * months), so an empty result reads as an intentional state rather than
 * something broken. Always `role="status"` so screen readers announce it as
 * a live result summary, matching the plain-text empty states it replaces.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 px-6 py-14 text-center",
        className,
      )}
    >
      <Icon className="size-8 text-muted-foreground/50" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
