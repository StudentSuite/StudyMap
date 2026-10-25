import { Footprints } from "lucide-react";

import type { Place } from "@/lib/types";
import { haversineKm, formatDistance, type LatLng } from "@/lib/geo";

const WALKING_SPEED_KMH = 5;

interface RouteEtaCardProps {
  home: LatLng | null;
  place: Place;
}

/** Rough "X min" walking estimate from a straight-line distance, at ~5 km/h. */
function formatWalkingEta(km: number): string {
  const minutes = Math.round((km / WALKING_SPEED_KMH) * 60);
  if (minutes < 1) return "under 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/**
 * Straight-line distance and a rough walking-time estimate from `home` to `place`.
 * No routing API is integrated here, so this is never real walking distance or
 * traffic-aware ETA, just a quick straight-line approximation; copy says so
 * explicitly rather than overselling precision this component doesn't have.
 */
export function RouteEtaCard({ home, place }: RouteEtaCardProps) {
  if (!home) return null;

  const distanceKm = haversineKm(home, { lat: place.lat, lng: place.lng });

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
      <Footprints className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <p>
        <span className="font-medium text-foreground">{formatDistance(distanceKm)} away</span>{" "}
        from home, straight-line. Roughly {formatWalkingEta(distanceKm)} walking at a 5 km/h
        pace, not a real route, so actual walking distance and time can differ.
      </p>
    </div>
  );
}
