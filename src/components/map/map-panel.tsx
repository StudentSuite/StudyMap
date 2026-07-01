"use client";

import { Search, Share2, X } from "lucide-react";

import type { City, PlaceType, Place } from "@/lib/types";
import { humanizeCity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryChips } from "@/components/map/category-chips";
import { NearMeButton } from "@/components/map/near-me-button";
import { MyPlacesPanel } from "@/components/map/my-places-panel";
import { ResultsList, type ResultRow } from "@/components/map/results-list";
import type { PlaceFilters } from "@/components/map/filters";
import type { LatLng } from "@/lib/geo";
import type { UserHome, UserPlaceRow } from "@/lib/user-places";

export interface MyPlacesProps {
  savedPlaces: UserPlaceRow[];
  cities: City[];
  query: string;
  onQueryChange: (query: string) => void;
  city: City | null;
  onCityChange: (city: City | null) => void;
  home: UserHome | null;
  onAddPlace: () => void;
  onEditPlace: (place: UserPlaceRow) => void;
  onLocateHome: () => void;
  onEditHome: () => void;
}

interface MapPanelProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
  cities: City[];
  typeCounts: Record<PlaceType, number>;
  resultCount: number;

  rows: ResultRow[];
  resultsHeader: string;
  resultsEmptyHint: string;
  resultsToggle?: { label: string; onClick: () => void } | null;
  onSelectPlace: (place: Place) => void;

  onLocated: (loc: LatLng) => void;
  onShare: () => void;

  /** Signed-in-only saved places section; omitted entirely when logged out. */
  myPlaces?: MyPlacesProps | null;

  showSearch?: boolean;
  showNearMe?: boolean;
  scrollChips?: boolean;
}

/**
 * The full map control stack: search, category chips, city select, actions,
 * and the results list. Shared by the desktop sidebar and the mobile sheet;
 * `showSearch` / `showNearMe` let the mobile layout hoist those into the
 * always-visible top bar and FAB instead.
 */
export function MapPanel({
  filters,
  onFiltersChange,
  cities,
  typeCounts,
  resultCount,
  rows,
  resultsHeader,
  resultsEmptyHint,
  resultsToggle,
  onSelectPlace,
  onLocated,
  onShare,
  myPlaces,
  showSearch = true,
  showNearMe = true,
  scrollChips = false,
}: MapPanelProps) {
  const dirty =
    filters.types.length > 0 || !!filters.city || !!filters.query;

  function toggleType(type: PlaceType) {
    onFiltersChange({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type],
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search places..."
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="h-9 pl-8"
            aria-label="Search places by name or city"
          />
        </div>
      )}

      <CategoryChips
        selected={filters.types}
        counts={typeCounts}
        onToggle={toggleType}
        scroll={scrollChips}
      />

      <div className="flex items-center gap-2">
        <Select
          value={filters.city ?? undefined}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, city: value === "all" ? null : value })
          }
        >
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {humanizeCity(city)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={() => onFiltersChange({ types: [], city: null, query: "" })}
          >
            <X className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      {showNearMe && (
        <div className="flex items-stretch gap-2">
          <NearMeButton onLocated={onLocated} className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={onShare}
            aria-label="Copy a shareable link to this view"
          >
            <Share2 className="size-4" />
            <span className="ml-1 hidden lg:inline">Share</span>
          </Button>
        </div>
      )}

      {myPlaces && <MyPlacesPanel {...myPlaces} />}

      <Separator />

      <p className="text-xs font-semibold text-foreground">
        {resultCount} {resultCount === 1 ? "place" : "places"} shown
      </p>

      <ResultsList
        header={resultsHeader}
        rows={rows}
        emptyHint={resultsEmptyHint}
        onSelect={onSelectPlace}
        toggle={resultsToggle}
      />
    </div>
  );
}
