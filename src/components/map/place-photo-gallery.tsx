import { MapPinOff } from "lucide-react";

import type { Place } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlacePhotoGalleryProps {
  place: Place;
}

/**
 * Street View preview for a place. `Place` has no photo/image field
 * (`data/places.schema.json` is `additionalProperties: false` and lists no
 * such field), so there is no real photo data to gallery - this is scoped
 * down to what's actually buildable from `lat`/`lng` alone.
 *
 * Uses the legacy `maps.google.com/maps?...&output=svembed` endpoint, which
 * renders a Street View panorama in an iframe without an API key (unlike the
 * newer, paid Maps Embed API). It is undocumented and could change or be
 * retired by Google without notice; if that happens, this iframe degrades to
 * the same "not available" fallback as a location with no Street View
 * coverage.
 *
 * Coverage gaps can't be detected client-side here: a location with no
 * Street View just renders a blank/grey iframe, same as a network failure.
 * Telling those apart needs the paid Street View Static API (to check for a
 * panorama first) or a `load`/`error` signal the iframe doesn't give us for
 * cross-origin content. So this always shows the iframe *and* a permanent
 * fallback hint below it, rather than trying to swap one for the other.
 */
export function PlacePhotoGallery({ place }: PlacePhotoGalleryProps) {
  const src = `https://maps.google.com/maps?q=${place.lat},${place.lng}&layer=c&cbll=${place.lat},${place.lng}&cbp=0&output=svembed`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Street View preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          <iframe
            key={place.id}
            src={src}
            title={`Street View preview of ${place.name}`}
            className="size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPinOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Street View not available here? Not every location has coverage -
          a blank or grey preview above means Google hasn&apos;t mapped this spot yet,
          not that something&apos;s broken.
        </p>
      </CardContent>
    </Card>
  );
}
