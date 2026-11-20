import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCount,
  formatMonth,
  pagesPerVisitor,
  percentChange,
  type TrafficMonth,
} from "@/lib/traffic";

interface StatProps {
  label: string;
  value: string;
  /** Percent change against the previous month, or null when there is none. */
  change: number | null;
  /** Month the change is measured against, for the caption. */
  comparedTo: string | null;
}

function Stat({ label, value, change, comparedTo }: StatProps) {
  const rounded = change === null ? null : Math.round(change * 10) / 10;
  const direction =
    rounded === null || rounded === 0 ? "flat" : rounded > 0 ? "up" : "down";
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus;

  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-semibold tracking-tight">{value}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {rounded === null || comparedTo === null ? (
            "First month tracked"
          ) : (
            <>
              <Icon
                className={cn(
                  "size-3.5",
                  direction === "up" && "text-success",
                  direction === "down" && "text-danger",
                )}
                aria-hidden="true"
              />
              <span>
                {rounded > 0 ? "+" : ""}
                {rounded}% vs {comparedTo}
              </span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

interface TrafficStatsProps {
  months: readonly TrafficMonth[];
}

/** Headline numbers for the newest month, with change against the month before it. */
export function TrafficStats({ months }: TrafficStatsProps) {
  const latest = months[months.length - 1];
  if (!latest) return null;
  const previous = months.length > 1 ? months[months.length - 2] : undefined;

  const ratio = pagesPerVisitor(latest);
  const previousRatio = previous ? pagesPerVisitor(previous) : null;
  const comparedTo = previous ? formatMonth(previous.month, "medium") : null;

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground">
        {formatMonth(latest.month, "long")}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Visitors"
          value={formatCount(latest.visitors)}
          change={percentChange(latest.visitors, previous?.visitors)}
          comparedTo={comparedTo}
        />
        <Stat
          label="Page views"
          value={formatCount(latest.pageViews)}
          change={percentChange(latest.pageViews, previous?.pageViews)}
          comparedTo={comparedTo}
        />
        <Stat
          label="Pages per visitor"
          value={ratio === null ? "n/a" : ratio.toFixed(2)}
          change={
            ratio === null || previousRatio === null
              ? null
              : percentChange(ratio, previousRatio)
          }
          comparedTo={comparedTo}
        />
      </div>
    </div>
  );
}
