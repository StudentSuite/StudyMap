import { Medal, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Place } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface ContributionLeaderboardProps {
  places: Place[];
  /** How many ranked rows to show. Defaults to top 10. */
  limit?: number;
}

interface ContributorRow {
  handle: string;
  count: number;
}

/**
 * Aggregates `added_by` across `places` into a ranked top-N list of
 * contributors. Pure client-side tally over the already-loaded dataset -
 * no new API or backend. Ties keep the stable order `Array.sort` already
 * gives JS engines (insertion order of first appearance), so re-running on
 * the same data is deterministic.
 */
function tallyContributions(places: Place[]): ContributorRow[] {
  const counts = new Map<string, number>();
  for (const place of places) {
    const handle = place.added_by;
    if (!handle) continue;
    counts.set(handle, (counts.get(handle) ?? 0) + 1);
  }
  return Array.from(counts, ([handle, count]) => ({ handle, count })).sort(
    (a, b) => b.count - a.count,
  );
}

const RANK_ICON: Record<number, { Icon: LucideIcon; className: string }> = {
  0: { Icon: Trophy, className: "text-amber-500" },
  1: { Icon: Medal, className: "text-slate-400" },
  2: { Icon: Medal, className: "text-amber-700" },
};

/** Ranked top-N list of contributors, by number of places they've added. */
export function ContributionLeaderboard({
  places,
  limit = 10,
}: ContributionLeaderboardProps) {
  const ranked = tallyContributions(places).slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top contributors</CardTitle>
      </CardHeader>
      <CardContent>
        {ranked.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No contributions yet"
            description="Places added by the community will show up here."
          />
        ) : (
          <ol className="flex flex-col gap-1">
            {ranked.map((row, index) => {
              const medal = RANK_ICON[index];
              return (
                <li key={row.handle}>
                  <a
                    href={`https://github.com/${row.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                  >
                    <span className="flex w-5 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground">
                      {medal ? (
                        <medal.Icon className={`size-4 ${medal.className}`} aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {row.handle}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.count} {row.count === 1 ? "place" : "places"}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
