"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { User } from "@supabase/supabase-js";
import { ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { Place, PlaceType } from "@/lib/types";
import { humanizeCity, PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import { cityBounds, filterPlaces, getCities } from "@/lib/places";
import { placesByDistance, type LatLng } from "@/lib/geo";
import { buildShareUrl, mapStateToSearch, parseMapState } from "@/lib/share";
import type { MapViewport } from "@/components/map/map-view";
import studyMapConfig from "../../../studymap.config";
import { createClient } from "@/lib/supabase/client";
import { isMissingTableError } from "@/lib/utils";
import {
  fetchUserHome,
  fetchUserPlaces,
  userPlaceToPlace,
  type UserHome,
  type UserPlaceRow,
} from "@/lib/user-places";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapErrorBoundary } from "@/components/map/map-error-boundary";
import { MapPanel } from "@/components/map/map-panel";
import { MapSheet, SHEET_SNAP_POINTS } from "@/components/map/map-sheet";
import { NearMeFab } from "@/components/map/near-me-fab";
import { UserPlaceDialog } from "@/components/map/user-place-dialog";
import { UserHomeDialog } from "@/components/map/user-home-dialog";
import type { ResultRow } from "@/components/map/results-list";
import type { PlaceFilters } from "@/components/map/filters";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div
      className="relative size-full animate-pulse bg-muted"
      role="status"
      aria-label="Loading map"
    >
      <div className="absolute inset-6 rounded-xl border border-border/60 bg-card/30" />
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card/60" />
      <span className="sr-only">Loading map</span>
    </div>
  ),
});

interface PlacesMapProps {
  places: Place[];
}

export function PlacesMap({ places }: PlacesMapProps) {
  const [filters, setFilters] = React.useState<PlaceFilters>(() => {
    if (typeof window === "undefined") return { types: [], city: null, query: "" };
    const state = parseMapState(window.location.search);
    // "q" is a plain search-term param (distinct from the filter state
    // mirrored via replaceState below): it's how the nav search's "see all
    // places" link and any other direct link hand off a free-text query.
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    return { types: state.types, city: state.city, query: q };
  });
  const [debouncedQuery, setDebouncedQuery] = React.useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [focusId, setFocusId] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const id = parseMapState(window.location.search).placeId ?? null;
    return id && places.some((place) => place.id === id) ? id : null;
  });
  // A viewport in the URL restores that exact center/zoom on load instead of
  // fitting all places; it is then kept in sync as the user pans (see #118).
  const [viewport, setViewport] = React.useState<MapViewport | null>(() => {
    if (typeof window === "undefined") return null;
    const state = parseMapState(window.location.search);
    if (state.lat === null || state.lng === null) return null;
    return {
      lat: state.lat,
      lng: state.lng,
      zoom: state.zoom ?? studyMapConfig.defaultZoom,
    };
  });
  const handleViewportChange = React.useCallback((next: MapViewport) => {
    setViewport(next);
  }, []);
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);
  const [closePopupTrigger, setClosePopupTrigger] = React.useState(0);
  const [sortByDistance, setSortByDistance] = React.useState(false);
  const [snap, setSnap] = React.useState<number | string | null>(
    SHEET_SNAP_POINTS[0],
  );
  // Sheet always open on mobile at peek snap; "closing" resets to peek, not hidden.
  const [sheetOpen, setSheetOpen] = React.useState(true);
  const hydrated = React.useRef(false);

  const [user, setUser] = React.useState<User | null>(null);
  const [savedPlaces, setSavedPlaces] = React.useState<UserPlaceRow[]>([]);
  const [home, setHome] = React.useState<UserHome | null>(null);
  const [myQuery, setMyQuery] = React.useState("");
  const [myCity, setMyCity] = React.useState<string | null>(null);
  const [placeDialogOpen, setPlaceDialogOpen] = React.useState(false);
  const [editingPlace, setEditingPlace] = React.useState<UserPlaceRow | null>(null);
  const [homeDialogOpen, setHomeDialogOpen] = React.useState(false);
  const [myPlacesError, setMyPlacesError] = React.useState<string | null>(null);
  const [lastUserId, setLastUserId] = React.useState<string | null>(null);

  const cities = React.useMemo(() => getCities(places), [places]);

  const activeFilters = React.useMemo(() => {
    const labels: string[] = [];
    if (filters.types.length > 0) {
      labels.push(`types: ${filters.types.map((type) => PLACE_TYPE_LABELS[type]).join(", ")}`);
    }
    if (filters.city) labels.push(`city: ${humanizeCity(filters.city)}`);
    if (filters.query.trim()) labels.push(`search: ${filters.query.trim()}`);
    return labels;
  }, [filters]);

  // Clear stale saved-places/home data as soon as the signed-in user changes,
  // during render rather than an effect, so there's no stale-data flash.
  const userId = user?.id ?? null;
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setSavedPlaces([]);
    setHome(null);
    setMyPlacesError(null);
  }

  React.useEffect(() => {
    hydrated.current = true;
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // self-host / preview mode: no auth, no private layer
    supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => setUser(null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    fetchUserPlaces()
      .then((rows) => {
        setSavedPlaces(rows);
        setMyPlacesError(null);
      })
      .catch((err) => {
        setSavedPlaces([]);
        setMyPlacesError(
          isMissingTableError(err)
            ? "This deployment's saved-places table isn't set up yet. See SELF-HOSTING.md."
            : "Couldn't load your saved places. Try reloading.",
        );
      });
    fetchUserHome().then(setHome).catch(() => setHome(null));
  }, [user]);

  // Debounce the search query so filtering doesn't run on every keystroke.
  // Clearing the box applies immediately (0 ms); typing waits 250 ms.
  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(filters.query),
      filters.query ? 250 : 0,
    );
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Mirror filter, focus, and viewport state back into the URL so it stays
  // shareable. replaceState keeps panning out of browser history, so the back
  // button still leaves the map in one press (see #118).
  React.useEffect(() => {
    if (!hydrated.current) return;
    const search = mapStateToSearch({
      types: filters.types,
      city: filters.city,
      placeId: focusId,
      lat: viewport?.lat ?? null,
      lng: viewport?.lng ?? null,
      zoom: viewport?.zoom ?? null,
    });
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [filters, focusId, viewport]);

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

  // Private layer: saved places always render on top of the public set,
  // independent of the public search/type/city filters above.
  const privatePlaces = React.useMemo(
    () => savedPlaces.map(userPlaceToPlace),
    [savedPlaces],
  );
  const mapPlaces = React.useMemo(
    () => [...visible, ...privatePlaces],
    [visible, privatePlaces],
  );

  const myCities = React.useMemo(() => getCities(privatePlaces), [privatePlaces]);

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
      lat: viewport?.lat ?? null,
      lng: viewport?.lng ?? null,
      zoom: viewport?.zoom ?? null,
    });
    if (!("clipboard" in navigator)) {
      toast.error("Copying isn't supported in this browser");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy link"));
  }

  function onLocated(loc: LatLng) {
    setUserLocation(loc);
    setClosePopupTrigger((t) => t + 1);
  }

  function openAddPlace() {
    setEditingPlace(null);
    setPlaceDialogOpen(true);
  }

  function openEditPlace(place: UserPlaceRow) {
    setEditingPlace(place);
    setPlaceDialogOpen(true);
  }

  function handlePlaceSaved(saved: UserPlaceRow) {
    setSavedPlaces((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved],
    );
  }

  function handlePlaceDeleted(id: string) {
    setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSelectSavedPlace(place: UserPlaceRow) {
    setFocusId(place.id);
    setSnap(SHEET_SNAP_POINTS[0]); // collapse to peek
  }

  async function handleDeleteSavedPlace(id: string) {
    try {
      const { deleteUserPlace } = await import("@/lib/user-places");
      await deleteUserPlace(id);
      handlePlaceDeleted(id);
      toast.success("Place deleted");
    } catch {
      toast.error("Couldn't delete this place. Try again.");
    }
  }

  function handleHomeSaved(saved: UserHome) {
    setHome(saved);
  }

  function handleHomeDeleted() {
    setHome(null);
  }

  function locateHome() {
    if (home) onLocated({ lat: home.lat, lng: home.lng });
  }

  function openSheet() {
    setSnap(SHEET_SNAP_POINTS[1]); // half height
    setSheetOpen(true);
  }

  function selectPlace(place: Place) {
    setFocusId(place.id);
    setSnap(SHEET_SNAP_POINTS[0]); // collapse to peek so pin is visible
  }

  const panelProps = {
    filters,
    onFiltersChange: setFilters,
    cities,
    typeCounts,
    resultCount: visible.length,
    rows,
    resultsHeader,
    activeFilters,
    onResetFilters: () => setFilters({ types: [], city: null, query: "" }),
    resultsToggle,
    onSelectPlace: selectPlace,
    focusId,
    onLocated,
    onShare: share,
    myPlaces: user
      ? {
          savedPlaces,
          error: myPlacesError,
          cities: myCities,
          query: myQuery,
          onQueryChange: setMyQuery,
          city: myCity,
          onCityChange: setMyCity,
          home,
          onAddPlace: openAddPlace,
          onEditPlace: openEditPlace,
          onSelectPlace: handleSelectSavedPlace,
          onDeletePlace: handleDeleteSavedPlace,
          onLocateHome: locateHome,
          onEditHome: () => setHomeDialogOpen(true),
        }
      : null,
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-hidden border-r border-border bg-card p-4 lg:flex">
        <MapPanel {...panelProps} showSearch showNearMe scrollChips />
      </aside>

      {/* Map + mobile overlays */}
      <div className="relative min-w-0 flex-1">
        <MapErrorBoundary>
          <MapView
            places={mapPlaces}
            userLocation={userLocation}
            focusId={focusId}
            focusBounds={focusBounds}
            closePopupTrigger={closePopupTrigger}
            center={viewport ? [viewport.lat, viewport.lng] : undefined}
            zoom={viewport?.zoom}
            initialViewport={viewport}
            onViewportChange={handleViewportChange}
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

        {/* Mobile near-me FAB, above peek sheet */}
        <NearMeFab
          onLocated={onLocated}
          className="absolute bottom-[calc(12vh+1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-[1000] lg:hidden"
        />

        {/* Mobile bottom sheet: always visible at peek, draggable to half/full */}
        <MapSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              // Reset to peek instead of fully hiding
              setSnap(SHEET_SNAP_POINTS[0]);
              setSheetOpen(true);
            } else {
              setSheetOpen(true);
            }
          }}
          snap={snap}
          onSnapChange={setSnap}
        >
          {/* Peek summary: visible when sheet at peek height */}
          {snap === SHEET_SNAP_POINTS[0] && (
            <button
              type="button"
              onClick={openSheet}
              className="flex w-full min-h-11 items-center justify-between text-left"
              aria-label="Expand places and filters"
            >
              <span className="text-sm font-semibold text-foreground">
                {visible.length} {visible.length === 1 ? "place" : "places"} shown
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {userLocation ? "Nearest" : "Browse"}
                <ChevronUp className="size-5" />
              </span>
            </button>
          )}
          {/* Full panel: visible when sheet above peek */}
          {snap !== SHEET_SNAP_POINTS[0] && (
            <MapPanel
              {...panelProps}
              showSearch={false}
              showNearMe={false}
              scrollChips
            />
          )}
        </MapSheet>
      </div>

      {user && (
        <>
          <UserPlaceDialog
            open={placeDialogOpen}
            onOpenChange={setPlaceDialogOpen}
            place={editingPlace}
            onSaved={handlePlaceSaved}
            onDeleted={handlePlaceDeleted}
          />
          <UserHomeDialog
            open={homeDialogOpen}
            onOpenChange={setHomeDialogOpen}
            home={home}
            onSaved={handleHomeSaved}
            onDeleted={handleHomeDeleted}
          />
        </>
      )}
    </div>
  );
}
