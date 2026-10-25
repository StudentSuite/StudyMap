import Link from "next/link";

import type { Place, PlaceType } from "@/lib/types";
import { PLACE_TYPES, PLACE_TYPE_LABELS, humanizeCity } from "@/lib/types";
import { filterPlaces } from "@/lib/places";
import { mapStateToSearch } from "@/lib/share";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CityStatsCardProps {
  /** City slug, e.g. "navi_mumbai". */
  city: string;
  places: Place[];
  className?: string;
}

/**
 * Per-type place-count breakdown for one city - "N Libraries", "N Airports",
 * etc, only showing types with at least one place. Each count links into
 * `/map` pre-filtered to that city and type, using `mapStateToSearch`
 * (`@/lib/share.ts`) so the query-param shape (`city`, `types`) matches the
 * map's own share links exactly rather than duplicating it ad hoc.
 */
export function CityStatsCard({ city, places, className }: CityStatsCardProps) {
  const counts = PLACE_TYPES.map((type) => ({
    type,
    count: filterPlaces(places, { city, types: [type] }).length,
  })).filter((entry): entry is { type: PlaceType; count: number } => entry.count > 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{humanizeCity(city)}</CardTitle>
      </CardHeader>
      <CardContent>
        {counts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No places recorded yet.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {counts.map(({ type, count }) => (
              <li key={type}>
                <Link
                  href={`/map${mapStateToSearch({
                    types: [type],
                    city,
                    query: "",
                    placeId: null,
                    lat: null,
                    lng: null,
                    zoom: null,
                  })}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <span>{PLACE_TYPE_LABELS[type]}</span>
                  <span className="tabular-nums font-medium">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
