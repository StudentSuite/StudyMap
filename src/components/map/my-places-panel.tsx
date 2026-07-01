"use client";

import { Home, Pencil, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { humanizeCity, PLACE_TYPE_LABELS, type City } from "@/lib/types";
import type { UserHome, UserPlaceRow } from "@/lib/user-places";

interface MyPlacesPanelProps {
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
  onLocateHome: () => void;
  onEditHome: () => void;
}

/** Signed-in-only saved-places layer: own search, own city filter, own CRUD. */
export function MyPlacesPanel({
  savedPlaces,
  error,
  cities,
  query,
  onQueryChange,
  city,
  onCityChange,
  home,
  onAddPlace,
  onEditPlace,
  onLocateHome,
  onEditHome,
}: MyPlacesPanelProps) {
  const q = query.trim().toLowerCase();
  const filtered = savedPlaces.filter((p) => {
    if (city && p.city !== city) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">My places</p>
        <Button size="sm" variant="outline" onClick={onAddPlace} className="h-7 gap-1 px-2 text-xs">
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {home ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Home className="size-3.5 shrink-0" />
          <span className="flex-1 truncate">{home.label}</span>
          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={onLocateHome}>
            Nearest to home
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onEditHome} aria-label="Edit home location">
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 justify-start px-1.5 text-xs text-muted-foreground" onClick={onEditHome}>
          <Home className="size-3.5" />
          Set home location
        </Button>
      )}

      {savedPlaces.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search your places..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-8 pl-7 text-sm"
              aria-label="Search your saved places"
            />
          </div>

          {cities.length > 1 && (
            <Select
              value={city ?? undefined}
              onValueChange={(value) => onCityChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue placeholder="All your cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All your cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {humanizeCity(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}

      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 py-4 text-center text-xs text-destructive">
            {error}
          </p>
        ) : savedPlaces.length === 0 ? (
          <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
            No saved places yet.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-border py-4 text-center text-xs text-muted-foreground">
            No saved places match this search.
          </p>
        ) : (
          filtered.map((place) => (
            <div key={place.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-sm font-medium text-foreground">{place.name}</p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onEditPlace(place)}
                  aria-label={`Edit ${place.name}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {PLACE_TYPE_LABELS[place.type]}
                </Badge>
                <span>{humanizeCity(place.city)}</span>
              </div>
              {place.address && (
                <p className="mt-1.5 text-xs text-muted-foreground">{place.address}</p>
              )}
              {place.note && (
                <p className="mt-1 text-xs text-muted-foreground/80">{place.note}</p>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
