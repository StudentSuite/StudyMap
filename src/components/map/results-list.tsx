"use client";

import * as React from "react";
import {
  ExternalLink,
  Info,
  MapPinPlus,
  MapPinX,
  Navigation,
  RotateCcw,
} from "lucide-react";

import type { Place } from "@/lib/types";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { directionsUrl } from "@/lib/map";
import { formatDistance } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryIcon } from "@/components/map/category-icon";
import { VerifiedBadge } from "@/components/pins/verified-badge";

export interface ResultRow {
  place: Place;
  distanceKm?: number;
}

/** Pick 2 or 3 rows to compare side by side. */
export interface CompareControls {
  selectedIds: string[];
  /** Most places that can be compared at once. */
  max: number;
  onToggle: (place: Place) => void;
  onOpen: () => void;
  onClear: () => void;
}

interface ResultsListProps {
  header: string;
  rows: ResultRow[];
  emptyState: {
    activeFilters: string[];
    onReset: () => void;
    onSuggest: () => void;
  };
  onSelect: (place: Place) => void;
  /** Opens the detail drawer for a place; the row shows an info button when set. */
  onDetails?: (place: Place) => void;
  compare?: CompareControls;
  focusId?: string | null;
  /** Optional expand/collapse control (e.g. "Show all" for the nearest list). */
  toggle?: { label: string; onClick: () => void } | null;
  /** Rows rendered at once; a "Show more" button reveals the next page. */
  pageSize?: number;
}

/** Rows rendered before "Show more", so the unfiltered map does not build ~2,000 rows. */
export const RESULTS_PAGE_SIZE = 100;

/** A scrollable list of places. Clicking a row flies the map to that pin. */
export function ResultsList({
  header,
  rows,
  emptyState,
  onSelect,
  onDetails,
  compare,
  focusId,
  toggle,
  pageSize = RESULTS_PAGE_SIZE,
}: ResultsListProps) {
  const [limit, setLimit] = React.useState(pageSize);

  // A new result set (filter, search, nearest-first) starts again from the first page.
  const [seenRows, setSeenRows] = React.useState(rows);
  if (rows !== seenRows) {
    setSeenRows(rows);
    setLimit(pageSize);
  }

  const shownRows = rows.slice(0, limit);
  // A focused pin beyond the page still needs its row, or the highlight would vanish.
  if (focusId && rows.length > limit) {
    const focused = rows.find((row) => row.place.id === focusId);
    if (focused && !shownRows.includes(focused)) shownRows.push(focused);
  }
  const nextPage = Math.min(pageSize, rows.length - limit);
  const hiddenCount = rows.length - shownRows.length;

  return (
    <div className="flex min-h-[120px] flex-1 flex-col">
      <div className="flex items-center justify-between pb-1.5">
        <p className="text-xs font-medium text-muted-foreground">{header}</p>
        {toggle && (
          <button
            type="button"
            onClick={toggle.onClick}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            {toggle.label}
          </button>
        )}
      </div>

      {compare && compare.selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 pb-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={compare.selectedIds.length < 2}
            onClick={compare.onOpen}
          >
            Compare ({compare.selectedIds.length})
          </Button>
          <button
            type="button"
            onClick={compare.onClear}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={MapPinX}
          className="py-8"
          title={
            emptyState.activeFilters.length > 0
              ? `No places match ${emptyState.activeFilters.join(" · ")}.`
              : "No places are available in this view yet."
          }
          description={
            emptyState.activeFilters.length > 0
              ? "Clear a filter or suggest the place that is missing."
              : "Know a useful place we should add? Suggest it to the maintainers."
          }
          action={
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {emptyState.activeFilters.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={emptyState.onReset}
                >
                  <RotateCcw className="size-3.5" />
                  Clear filters
                </Button>
              )}
              <Button type="button" size="sm" onClick={emptyState.onSuggest}>
                <MapPinPlus className="size-3.5" />
                Suggest a place
              </Button>
            </div>
          }
        />
      ) : (
        <ul className="min-h-0 space-y-1 overflow-y-auto">
          {shownRows.map(({ place, distanceKm }) => (
            <li key={place.id}>
              <div
                className={`group flex items-center gap-2.5 rounded-md px-2 py-2 ${
                  focusId === place.id ? "bg-muted ring-1 ring-border" : "hover:bg-muted"
                }`}
              >
                {compare && (
                  <input
                    type="checkbox"
                    aria-label={"Compare " + place.name}
                    checked={compare.selectedIds.includes(place.id)}
                    disabled={
                      !compare.selectedIds.includes(place.id) &&
                      compare.selectedIds.length >= compare.max
                    }
                    onChange={() => compare.onToggle(place)}
                    className="size-4 shrink-0 accent-primary"
                  />
                )}
                <CategoryIcon type={place.type} className="shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  aria-current={focusId === place.id ? "true" : undefined}
                  className="min-w-0 flex-1 text-left"
                  title={`${place.name} (${PLACE_TYPE_LABELS[place.type]})`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="block truncate text-sm text-foreground">
                      {place.name}
                    </span>
                    <VerifiedBadge place={place} />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {PLACE_TYPE_LABELS[place.type]}
                    {distanceKm !== undefined && ` · ${formatDistance(distanceKm)}`}
                  </span>
                </button>
                {onDetails && (
                  <button
                    type="button"
                    onClick={() => onDetails(place)}
                    aria-label={"Details for " + place.name}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground"
                  >
                    <Info className="size-4" />
                  </button>
                )}
                {place.gmaps_link && (
                  <a
                    href={place.gmaps_link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${place.name} in Google Maps`}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <a
                  href={directionsUrl(place.lat, place.lng)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Directions to ${place.name}`}
                  className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground"
                >
                  <Navigation className="size-4" />
                </a>
              </div>
            </li>
          ))}
          {rows.length > limit && (
            <li className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLimit((current) => current + pageSize)}
              >
                Show {nextPage} more ({hiddenCount} not shown)
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
