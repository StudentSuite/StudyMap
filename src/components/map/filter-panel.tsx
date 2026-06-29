"use client";

import { PLACE_TYPES, PLACE_TYPE_LABELS, humanizeCity } from "@/lib/types";
import type { City, PlaceType } from "@/lib/types";
import { PLACE_TYPE_COLORS } from "@/lib/map";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PlaceFilters {
  types: PlaceType[];
  city: City | null;
  query: string;
}

interface FilterPanelProps {
  filters: PlaceFilters;
  cities: City[];
  onChange: (filters: PlaceFilters) => void;
  resultCount: number;
  typeCounts: Record<PlaceType, number>;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function FilterPanel({
  filters,
  cities,
  onChange,
  resultCount,
  typeCounts,
}: FilterPanelProps) {
  const allEmpty = filters.types.length === 0 && !filters.city && !filters.query;

  return (
    <div className="flex max-h-[70vh] w-full flex-col gap-3 overflow-y-auto">
      <Input
        type="search"
        placeholder="Search places..."
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        className="h-8 text-sm"
        aria-label="Search places by name or city"
      />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {resultCount} {resultCount === 1 ? "place" : "places"}
        </p>
        {!allEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange({ types: [], city: null, query: "" })}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">City</p>
        <Select
          value={filters.city ?? "all"}
          onValueChange={(value) =>
            onChange({ ...filters, city: value === "all" ? null : value })
          }
        >
          <SelectTrigger className="w-full">
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
      </div>

      <Separator />

      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="text-xs font-medium text-muted-foreground">Type</legend>
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
            <span className="flex-1">{PLACE_TYPE_LABELS[type]}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {typeCounts[type]}
            </span>
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-muted-foreground">
        No filter selected means everything shows.
      </p>
    </div>
  );
}
