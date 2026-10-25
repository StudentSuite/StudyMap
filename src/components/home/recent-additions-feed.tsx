import Link from "next/link";

import type { Place } from "@/lib/types";
import { PLACE_TYPE_LABELS, humanizeCity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentAdditionsFeedProps {
  /**
   * Already ordered by the caller, most-recent-first, however the caller
   * decides "recent" (e.g. from git history on `data/places/*.json`, or a
   * future `added_on`/`created_at` field).
   *
   * The `Place` schema (`src/lib/types.ts`, `data/places.schema.json`) has
   * no date/timestamp field recording when a place was added - only
   * `added_by` (a GitHub username) and, unrelated, an optional
   * `verified.on` date that records when someone last *re-checked* a place,
   * not when it was first added. So this component does not sort, infer, or
   * fabricate a recency order itself: it is presentation-only, and a real
   * "recent additions" feed needs that data field added first.
   */
  places: Place[];
  limit?: number;
  className?: string;
}

/** A clean scrolling list of places: name, type badge, city, and who added it. */
export function RecentAdditionsFeed({
  places,
  limit = 10,
  className,
}: RecentAdditionsFeedProps) {
  const shown = places.slice(0, limit);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent additions</CardTitle>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {shown.map((place) => (
              <li key={place.id}>
                <Link
                  href={`/map?place=${encodeURIComponent(place.id)}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {place.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {humanizeCity(place.city)} &middot; added by {place.added_by}
                    </span>
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {PLACE_TYPE_LABELS[place.type]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
