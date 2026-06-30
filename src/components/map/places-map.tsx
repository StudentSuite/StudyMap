"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { Place, PlaceType } from "@/lib/types";
import { PLACE_TYPES } from "@/lib/types";
import { cityBounds, filterPlaces, getCities } from "@/lib/places";
import { placesByDistance, type LatLng } from "@/lib/geo";
import { buildShareUrl, mapStateToSearch, parseMapState } from "@/lib/share";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapErrorBoundary } from "@/components/map/map-error-boundary";
import { MapPanel } from "@/components/map/map-panel";
import { MapSheet, SHEET_SNAP_POINTS } from "@/components/map/map-sheet";
import { NearMeFab } from "@/components/map/near-me-fab";
import type { ResultRow } from "@/components/map/results-list";
import type { PlaceFilters } from "@/components/map/filters";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="size-full animate-pulse bg-muted" aria-hidden />
  ),
});

interface PlacesMapProps {
  places: Place[];
}

export function PlacesMap({ places }: PlacesMapProps) {
  const [filters, setFilters] = React.useState<PlaceFilters>(() => {
    if (typeof window === "undefined") return { types: [], city: null, query: "" };
    const state = parseMapState(window.location.search);
    return { types: state.types, city: state.city, query: "" };
  });
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [focusId, setFocusId] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return parseMapState(window.location.search).placeId ?? null;
  });
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);
  const [sortByDistance, setSortByDistance] = React.useState(false);
  const [snap, setSnap] = React.useState<number | string | null>(
    SHEET_SNAP_POINTS[0],
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const hydrated = React.useRef(false);

  const cities = React.useMemo(() => getCities(places), [places]);

  React.useEffect(() => {
    hydrated.current = true;
  }, []);

  // Debounce the search query so filtering doesn't run on every keystroke.
  // Clearing the box applies immediately (0 ms); typing waits 250 ms.
  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(filters.query),
      filters.query ? 250 : 0,
    );
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Mirror filter and focus state back into the URL so it stays shareable.
  React.useEffect(() => {
    if (!hydrated.current) return;
    const search = mapStateToSearch({
      types: filters.types,
      city: filters.city,
      placeId: focusId,
    });
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [filters, focusId]);

  const visible = React.useMemo(
    () =>
      filterPlaces(places, {
        types: filters.types,
        city: filters.city,
        query: debouncedQuery,
      }),
    [places, filters.types, filters.city, debouncedQuery],
  );

  const typeCounts = React.useMemo(() => {
    const counts = Object.fromEntries(
      PLACE_TYPES.map((t) => [t, 0]),
    ) as Record<PlaceType, number>;
    for (const place of visible) counts[place.type]++;
    return counts;
  }, [visible]);

  const focusBounds = React.useMemo(
    () => (filters.city ? cityBounds(places, filters.city) : null),
    [places, filters.city],
  );

  const byDistance = React.useMemo(() => {
    if (!userLocation) return [];
    return placesByDistance(visible, userLocation);
  }, [visible, userLocation]);

  // Build the results list: nearest-first when located, otherwise all visible.
  const { rows, resultsHeader, resultsToggle } = React.useMemo(() => {
    if (userLocation && byDistance.length > 0) {
      const shown = sortByDistance ? byDistance : byDistance.slice(0, 5);
      return {
        rows: shown.map((p) => ({ place: p, distanceKm: p.distanceKm })) as ResultRow[],
        resultsHeader: sortByDistance
          ? `All ${byDistance.length}, nearest first`
          : "Nearest to you",
        resultsToggle:
          byDistance.length > 5
            ? {
                label: sortByDistance ? "Show fewer" : "Show all",
                onClick: () => setSortByDistance((s) => !s),
              }
            : null,
      };
    }
    return {
      rows: visible.map((place) => ({ place })) as ResultRow[],
      resultsHeader: "All places",
      resultsToggle: null,
    };
  }, [userLocation, byDistance, sortByDistance, visible]);

  function share() {
    const url = buildShareUrl({
      types: filters.types,
      city: filters.city,
      placeId: focusId,
    });
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  function onLocated(loc: LatLng) {
    setUserLocation(loc);
  }

  function openSheet() {
    setSnap(SHEET_SNAP_POINTS[0]);
    setSheetOpen(true);
  }

  function selectPlace(place: Place) {
    setFocusId(place.id);
    setSheetOpen(false); // collapse the mobile sheet so the pin is visible
  }

  const panelProps = {
    filters,
    onFiltersChange: setFilters,
    cities,
    typeCounts,
    resultCount: visible.length,
    rows,
    resultsHeader,
    resultsEmptyHint: "No places match these filters. Try Reset.",
    resultsToggle,
    onSelectPlace: selectPlace,
    onLocated,
    onShare: share,
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-[360px] shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
        <MapPanel {...panelProps} showSearch showNearMe />
      </aside>

      {/* Map + mobile overlays */}
      <div className="relative min-w-0 flex-1">
        <MapErrorBoundary>
          <MapView
            places={visible}
            userLocation={userLocation}
            focusId={focusId}
            focusBounds={focusBounds}
          />
        </MapErrorBoundary>

        {/* Mobile top bar: persistent search + filters trigger */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex gap-2 lg:hidden">
          <div className="pointer-events-auto relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search places..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              aria-label="Search places by name or city"
              className="h-11 bg-card pl-8 shadow-md"
            />
          </div>
          <Button
            variant="secondary"
            className="pointer-events-auto h-11 shrink-0 px-4 shadow-md"
            onClick={openSheet}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        {/* Mobile near-me FAB, lifted above the peek bar */}
        <NearMeFab
          onLocated={onLocated}
          className="absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-[1000] lg:hidden"
        />

        {/* Mobile peek bar: always-visible results summary; tap to open sheet */}
        <button
          type="button"
          onClick={openSheet}
          aria-label="Open places and filters"
          className="absolute inset-x-0 bottom-0 z-[1000] flex min-h-14 items-center justify-between border-t border-border bg-card px-4 py-3 text-left shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.3)] lg:hidden"
        >
          <span className="text-sm font-semibold text-foreground">
            {visible.length} {visible.length === 1 ? "place" : "places"} shown
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {userLocation ? "Nearest" : "Browse"}
            <ChevronUp className="size-5" />
          </span>
        </button>

        {/* Mobile bottom sheet */}
        <MapSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          snap={snap}
          onSnapChange={setSnap}
        >
          <MapPanel
            {...panelProps}
            showSearch={false}
            showNearMe={false}
            scrollChips
          />
        </MapSheet>
      </div>
    </div>
  );
}
