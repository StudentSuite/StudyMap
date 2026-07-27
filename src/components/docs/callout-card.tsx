import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalloutCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A card deliberately outside the numbered step sequence (a support link, a
 * reference list). Dashed border + muted background keep it visually
 * distinct from StepCard so a reader scanning steps doesn't mistake it for
 * the next step in order.
 */
export function CalloutCard({ title, description, children, className }: CalloutCardProps) {
  return (
    <Card className={cn("border border-dashed border-border bg-muted/40", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-foreground/80">{children}</CardContent>
    </Card>
  );
}
