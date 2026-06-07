"use client";

import { CITIES, CITY_LABELS, PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import type { City, PlaceType } from "@/lib/types";
import { PERSONAL_PIN_COLOR, PLACE_TYPE_COLORS } from "@/lib/map";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export interface PlaceFilters {
  types: PlaceType[];
  cities: City[];
}

interface FilterPanelProps {
  filters: PlaceFilters;
  onChange: (filters: PlaceFilters) => void;
  resultCount: number;
  /** Number of private pins, or undefined to hide the My places toggle. */
  personalCount?: number;
  showPersonal?: boolean;
  onTogglePersonal?: (show: boolean) => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function FilterPanel({
  filters,
  onChange,
  resultCount,
  personalCount,
  showPersonal = false,
  onTogglePersonal,
}: FilterPanelProps) {
  const allEmpty = filters.types.length === 0 && filters.cities.length === 0;
  const showPersonalToggle =
    personalCount !== undefined && onTogglePersonal !== undefined;

  return (
    <div className="flex max-h-[70vh] w-full flex-col gap-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {resultCount} {resultCount === 1 ? "place" : "places"}
        </p>
        {!allEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange({ types: [], cities: [] })}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">City</p>
        {CITIES.map((city) => (
          <label key={city} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filters.cities.includes(city)}
              onCheckedChange={() =>
                onChange({ ...filters, cities: toggle(filters.cities, city) })
              }
            />
            {CITY_LABELS[city]}
          </label>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Type</p>
        {PLACE_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filters.types.includes(type)}
              onCheckedChange={() =>
                onChange({ ...filters, types: toggle(filters.types, type) })
              }
            />
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: PLACE_TYPE_COLORS[type] }}
            />
            <span>{PLACE_TYPE_LABELS[type]}</span>
          </label>
        ))}
      </div>

      {showPersonalToggle && (
        <>
          <Separator />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={showPersonal}
              onCheckedChange={() => onTogglePersonal(!showPersonal)}
            />
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: PERSONAL_PIN_COLOR }}
            />
            <span>My places ({personalCount})</span>
          </label>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        No filter selected means everything shows.
      </p>
      <Label className="sr-only">Filter places by city and type</Label>
    </div>
  );
}
