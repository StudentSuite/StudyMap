"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Share2, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import type { Place } from "@/lib/types";
import { filterPlaces } from "@/lib/places";
import { placesByDistance, formatDistance, type LatLng } from "@/lib/geo";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { directionsUrl } from "@/lib/map";
import { buildShareUrl, mapStateToSearch, parseMapState } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FilterPanel, type PlaceFilters } from "@/components/map/filter-panel";
import { MapErrorBoundary } from "@/components/map/map-error-boundary";
import { NearMeButton } from "@/components/map/near-me-button";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

interface PlacesMapProps {
  places: Place[];
}

export function PlacesMap({ places }: PlacesMapProps) {
  const [filters, setFilters] = React.useState<PlaceFilters>({
    types: [],
    cities: [],
  });
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);
  const hydrated = React.useRef(false);

  // Restore filters and the focused pin from the URL on first load.
  React.useEffect(() => {
    const state = parseMapState(window.location.search);
    setFilters({ types: state.types, cities: state.cities });
    setFocusId(state.placeId);
    hydrated.current = true;
  }, []);

  // Mirror filter and focus state back into the URL so it stays shareable.
  React.useEffect(() => {
    if (!hydrated.current) return;
    const search = mapStateToSearch({
      types: filters.types,
      cities: filters.cities,
      placeId: focusId,
    });
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [filters, focusId]);

  const visible = React.useMemo(
    () => filterPlaces(places, filters),
    [places, filters],
  );

  function share() {
    const url = buildShareUrl({
      types: filters.types,
      cities: filters.cities,
      placeId: focusId,
    });
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  const nearest = React.useMemo(() => {
    if (!userLocation) return [];
    return placesByDistance(visible, userLocation).slice(0, 5);
  }, [visible, userLocation]);

  return (
    <div className="relative size-full overflow-hidden">
      <MapErrorBoundary>
        <MapView
          places={visible}
          userLocation={userLocation}
          focusId={focusId}
        />
      </MapErrorBoundary>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-end sm:hidden">
        <Button
          variant="secondary"
          className="pointer-events-auto h-10 px-4 shadow"
          aria-expanded={panelOpen}
          aria-controls="map-filter-panel"
          onClick={() => setPanelOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
      </div>

      {/* Mobile backdrop: tap outside the sheet to close */}
      {panelOpen && (
        <div
          className="absolute inset-0 z-[1000] bg-black/40 sm:hidden"
          aria-hidden
          onClick={() => setPanelOpen(false)}
        />
      )}

      <Card
        id="map-filter-panel"
        data-open={panelOpen}
        className="absolute z-[1001] hidden p-4 shadow-lg data-[open=true]:block max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[72dvh] max-sm:w-full max-sm:overflow-y-auto max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:left-3 sm:top-3 sm:block sm:w-72"
      >
        <div className="mb-2 flex items-center justify-between sm:hidden">
          <p className="text-sm font-semibold">Filters</p>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Close filters"
            onClick={() => setPanelOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={visible.length}
        />

        <Separator className="my-3" />
        <div className="flex gap-2">
          <NearMeButton onLocated={setUserLocation} className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={share}
            aria-label="Copy a shareable link to this view"
          >
            <Share2 className="size-4" />
            Share
          </Button>
        </div>

        {nearest.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Nearest to you
            </p>
            <ul className="space-y-1.5">
              {nearest.map((place) => (
                <li
                  key={place.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <a
                    href={directionsUrl(place.lat, place.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate hover:underline"
                    title={`${place.name} (${PLACE_TYPE_LABELS[place.type]})`}
                  >
                    {place.name}
                  </a>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistance(place.distanceKm)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
