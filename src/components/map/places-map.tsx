"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";

import type { Place } from "@/lib/types";
import { filterPlaces } from "@/lib/places";
import { placesByDistance, formatDistance, type LatLng } from "@/lib/geo";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { directionsUrl } from "@/lib/map";
import { useAccount } from "@/components/account/use-account";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FilterPanel, type PlaceFilters } from "@/components/map/filter-panel";
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
  const { pins, user } = useAccount();
  const [filters, setFilters] = React.useState<PlaceFilters>({
    types: [],
    cities: [],
  });
  const [showPersonal, setShowPersonal] = React.useState(true);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);

  const visible = React.useMemo(
    () => filterPlaces(places, filters),
    [places, filters],
  );

  const nearest = React.useMemo(() => {
    if (!userLocation) return [];
    return placesByDistance(visible, userLocation).slice(0, 5);
  }, [visible, userLocation]);

  const personalLayer = showPersonal ? pins : [];
  const hasPersonal = Boolean(user) && pins.length > 0;

  return (
    <div className="relative size-full overflow-hidden">
      <MapView
        places={visible}
        personalPins={personalLayer}
        userLocation={userLocation}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-end sm:hidden">
        <Button
          size="sm"
          variant="secondary"
          className="pointer-events-auto shadow"
          onClick={() => setPanelOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
      </div>

      <Card
        data-open={panelOpen}
        className="absolute left-3 top-3 z-[1000] hidden w-72 p-4 shadow-lg sm:block data-[open=true]:block"
      >
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={visible.length}
          personalCount={hasPersonal ? pins.length : undefined}
          showPersonal={showPersonal}
          onTogglePersonal={setShowPersonal}
        />

        <Separator className="my-3" />
        <NearMeButton onLocated={setUserLocation} />

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
