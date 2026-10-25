"use client";

import { ExternalLink } from "lucide-react";

import type { Place } from "@/lib/types";
import { humanizeCity, PLACE_TYPE_LABELS } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { formatDistance, haversineKm } from "@/lib/geo";
import { VerifiedBadge } from "@/components/pins/verified-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ComparePlacesSheetProps {
  /** 2-3 places to compare side by side. */
  places: Place[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PairDistance {
  a: Place;
  b: Place;
  km: number;
}

/** Every pairwise straight-line distance among `places` (reuses `haversineKm`, not a reimplementation). */
function pairDistances(places: Place[]): PairDistance[] {
  const pairs: PairDistance[] = [];
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      pairs.push({ a: places[i], b: places[j], km: haversineKm(places[i], places[j]) });
    }
  }
  return pairs;
}

/**
 * Side-by-side comparison of 2-3 places, with the straight-line distance
 * between each pair. Callers are expected to pass 2 or 3 places; fewer than
 * 2 just renders the one card with no distances.
 */
export function ComparePlacesSheet({ places, open, onOpenChange }: ComparePlacesSheetProps) {
  const distances = places.length > 1 ? pairDistances(places) : [];

  return (
    <Sheet open={open && places.length > 0} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Compare places</SheetTitle>
          <SheetDescription>
            {places.length} place{places.length === 1 ? "" : "s"} side by side.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 sm:flex-row sm:gap-2">
          {places.map((place) => (
            <Card key={place.id} size="sm" className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <span className="truncate">{place.name}</span>
                  <VerifiedBadge place={place} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: PLACE_TYPE_COLORS[place.type] }}
                  />
                  {PLACE_TYPE_LABELS[place.type]}
                </div>
                <p className="text-xs text-muted-foreground">{humanizeCity(place.city)}</p>
                {place.address && (
                  <p className="text-xs leading-snug text-muted-foreground">
                    {place.address}
                  </p>
                )}
                {place.gmaps_link && (
                  <a
                    href={place.gmaps_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Open in Maps
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {distances.length > 0 && (
          <div className="mx-4 mb-4 space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Distance apart</p>
            {distances.map(({ a, b, km }) => (
              <p key={`${a.id}-${b.id}`} className="text-xs text-foreground">
                {a.name} <span className="text-muted-foreground">to</span> {b.name}:{" "}
                <span className="font-medium">{formatDistance(km)}</span>
              </p>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
