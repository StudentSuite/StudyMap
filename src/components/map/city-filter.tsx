"use client";

import * as React from "react";
import { X } from "lucide-react";

import type { City } from "@/lib/types";
import { humanizeCity } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface CityFilterProps {
  cities: City[];
  /** The selected city slug, or null for "All cities". */
  value: City | null;
  onChange: (city: City | null) => void;
}

/**
 * Type-to-search city filter. With 500+ cities a plain dropdown is a long scroll, so this is a
 * text input backed by a native `<datalist>` (the same pattern as the suggest-place dialog):
 * typing narrows the suggestions, picking one selects that city, and clearing the field
 * returns to "All cities". Typing something that is not a city leaves the current filter alone
 * and the field snaps back to the selected city when it loses focus.
 */
export function CityFilter({ cities, value, onChange }: CityFilterProps) {
  const listId = React.useId();
  const [text, setText] = React.useState(value ? humanizeCity(value) : "");

  // Keep the field in step when the filter changes from outside (Reset, a shared link).
  const [seenValue, setSeenValue] = React.useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value ? humanizeCity(value) : "");
  }

  const bySlugLabel = React.useMemo(() => {
    const map = new Map<string, City>();
    for (const city of cities) {
      const key = humanizeCity(city).toLowerCase();
      if (!map.has(key)) map.set(key, city);
    }
    return map;
  }, [cities]);

  function handleChange(next: string) {
    setText(next);
    if (next.trim() === "") {
      if (value !== null) onChange(null);
      return;
    }
    const match = bySlugLabel.get(next.trim().toLowerCase());
    if (match && match !== value) onChange(match);
  }

  function handleBlur() {
    setText(value ? humanizeCity(value) : "");
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        type="text"
        aria-label="Filter by city"
        placeholder="All cities"
        autoComplete="off"
        list={listId}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="h-8 pr-7 text-sm"
      />
      {text !== "" && (
        <button
          type="button"
          aria-label="Clear city filter"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          // Keep focus in the field so the blur handler does not undo the clear.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleChange("")}
        >
          <X className="size-3.5" />
        </button>
      )}
      <datalist id={listId}>
        {cities.map((city) => (
          <option key={city} value={humanizeCity(city)} />
        ))}
      </datalist>
    </div>
  );
}
