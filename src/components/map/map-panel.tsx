"use client";

import * as React from "react";
import { Code2, MapPinPlus, Search, Share2, Star, X } from "lucide-react";

import type { City, PlaceType, Place } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategoryChips } from "@/components/map/category-chips";
import { FilterPresets } from "@/components/map/filter-presets";
import { CityFilter } from "@/components/map/city-filter";
import { CountryFilter } from "@/components/map/country-filter";
import { NearMeButton } from "@/components/map/near-me-button";
import { MyPlacesPanel } from "@/components/map/my-places-panel";
import { SuggestPlaceDialog } from "@/components/map/suggest-place-dialog";
import { EmbedWidgetDialog } from "@/components/map/embed-widget";
import {
  ResultsList,
  type CompareControls,
  type ResultRow,
  type ViewFilterControls,
} from "@/components/map/results-list";
import type { PlaceFilters } from "@/components/map/filters";
import type { LatLng } from "@/lib/geo";
import type { UserHome, UserPlaceRow } from "@/lib/user-places";

export interface MyPlacesProps {
  savedPlaces: UserPlaceRow[];
  error: string | null;
  cities: City[];
  query: string;
  onQueryChange: (query: string) => void;
  city: City | null;
  onCityChange: (city: City | null) => void;
  home: UserHome | null;
  onAddPlace: () => void;
  onEditPlace: (place: UserPlaceRow) => void;
  onSelectPlace?: (place: UserPlaceRow) => void;
  onDeletePlace?: (id: string) => void;
  onLocateHome: () => void;
  onEditHome: () => void;
}

/** The "Saved" filter, the Share action, and the banner for a shared shortlist (#355). */
export interface SavedControls {
  /** How many of the visitor's own saved places still exist in the dataset. */
  count: number;
  /** True while the list is narrowed to the visitor's saved places. */
  active: boolean;
  onToggle: () => void;
  onShare: () => void;
  /** Set while a `?saved=` link is open: a read-only shortlist from someone else. */
  shared: { count: number; onSaveAll: () => void; onExit: () => void } | null;
}

interface MapPanelProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
  /** Country codes in the dataset, sorted by display name. */
  countries: string[];
  /** Every city in the dataset (used for suggestions). */
  cities: City[];
  /** Cities the city filter offers; defaults to `cities`, narrowed when a country is picked. */
  cityOptions?: City[];
  typeCounts: Record<PlaceType, number>;
  resultCount: number;
  /** What `resultCount` counts: the places in the visible map area, or all places that match the filters. */
  resultScope?: "view" | "total";
  /** The "Only places in this view" switch and "Search this area" prompt; omitted to hide them. */
  viewFilter?: ViewFilterControls;

  rows: ResultRow[];
  resultsHeader: string;
  activeFilters: string[];
  onResetFilters: () => void;
  resultsToggle?: { label: string; onClick: () => void } | null;
  savedControls?: SavedControls;
  onSelectPlace: (place: Place) => void;
  onShowDetails?: (place: Place) => void;
  compare?: CompareControls;
  focusId?: string | null;

  onLocated: (loc: LatLng) => void;
  onShare: () => void;

  /** Signed-in-only saved places section; omitted entirely when logged out. */
  myPlaces?: MyPlacesProps | null;

  showSearch?: boolean;
  showNearMe?: boolean;
  scrollChips?: boolean;
}

/**
 * The full map control stack: search, category chips, city filter, actions,
 * and the results list. Shared by the desktop sidebar and the mobile sheet;
 * `showSearch` / `showNearMe` let the mobile layout hoist those into the
 * always-visible top bar and FAB instead.
 */
export function MapPanel({
  filters,
  onFiltersChange,
  countries,
  cities,
  cityOptions,
  typeCounts,
  resultCount,
  resultScope,
  viewFilter,
  rows,
  resultsHeader,
  activeFilters,
  onResetFilters,
  resultsToggle,
  savedControls,
  onSelectPlace,
  onShowDetails,
  compare,
  focusId,
  onLocated,
  onShare,
  myPlaces,
  showSearch = true,
  showNearMe = true,
  scrollChips = false,
}: MapPanelProps) {
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [embedOpen, setEmbedOpen] = React.useState(false);

  const dirty =
    filters.types.length > 0 || !!filters.city || !!filters.country || !!filters.query;

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

      <FilterPresets onApply={(types) => onFiltersChange({ ...filters, types })} />

      <div className="flex items-center gap-2">
        <CountryFilter
          countries={countries}
          value={filters.country}
          onChange={(country) => onFiltersChange({ ...filters, country })}
        />
      </div>

      <div className="flex items-center gap-2">
        <CityFilter
          cities={cityOptions ?? cities}
          value={filters.city}
          onChange={(city) => onFiltersChange({ ...filters, city })}
        />
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={() =>
              onFiltersChange({ types: [], city: null, country: null, query: "" })
            }
          >
            <X className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/*
        Near Me is gated by showNearMe: mobile has its own NearMeFab, so
        the inline button would be redundant there. Share and Embed have
        no such mobile equivalent - they always render, or mobile users
        have no way to reach either (the gap #310 surfaced for Embed).
      */}
      <div className="flex items-stretch gap-2">
        {showNearMe && <NearMeButton onLocated={onLocated} className="flex-1" />}
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
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => setEmbedOpen(true)}
          aria-label="Get an embed code for this view"
        >
          <Code2 className="size-4" />
          <span className="ml-1 hidden lg:inline">Embed</span>
        </Button>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="h-8 justify-start gap-1.5 px-1.5 text-muted-foreground"
        onClick={() => setSuggestOpen(true)}
      >
        <MapPinPlus className="size-3.5" />
        Suggest a place
      </Button>

      {savedControls && (
        <div className="flex flex-col gap-1.5">
          {savedControls.shared ? (
            <div
              role="status"
              className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs"
            >
              <p className="text-foreground">
                A shortlist of {savedControls.shared.count}{" "}
                {savedControls.shared.count === 1 ? "place" : "places"} was shared with
                you. It is read only: your own saved places are not changed.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={savedControls.shared.onSaveAll}>
                  Save all to my list
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={savedControls.shared.onExit}
                >
                  Show all places
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-pressed={savedControls.active}
                onClick={savedControls.onToggle}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  savedControls.active
                    ? "border-amber-500 bg-amber-500/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Star
                  className="size-3.5"
                  fill={savedControls.active ? "currentColor" : "none"}
                  aria-hidden
                />
                Saved
                <span className="tabular-nums text-[11px] text-muted-foreground">
                  {savedControls.count}
                </span>
              </button>
              {savedControls.count > 0 && (
                <button
                  type="button"
                  onClick={savedControls.onShare}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Share list
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {myPlaces && <MyPlacesPanel {...myPlaces} />}

      <Separator />

      <p className="text-xs font-semibold text-foreground">
        {resultCount} {resultCount === 1 ? "place" : "places"}{" "}
        {resultScope === "view"
          ? "in this view"
          : resultScope === "total"
            ? "total"
            : "shown"}
      </p>

      <ResultsList
        header={resultsHeader}
        rows={rows}
        emptyState={{
          activeFilters,
          onReset: onResetFilters,
          onSuggest: () => setSuggestOpen(true),
        }}
        onSelect={onSelectPlace}
        onDetails={onShowDetails}
        compare={compare}
        focusId={focusId}
        toggle={resultsToggle}
        viewFilter={viewFilter}
      />

      <SuggestPlaceDialog
        datasetCities={cities}
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
      />
      <EmbedWidgetDialog open={embedOpen} onOpenChange={setEmbedOpen} />
    </div>
  );
}
