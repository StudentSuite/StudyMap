"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { humanizeCity } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CitySwitcherProps {
  /** City slugs to offer, e.g. `getCities(getPlaces())`. */
  cities: string[];
  className?: string;
}

/**
 * Searchable "jump to a city" dropdown that navigates to `/city/<slug>` on
 * selection. No `Command`/`Popover` combobox exists in this repo yet, so
 * this is built on the existing `Select` primitive (`@/components/ui/select`,
 * `position="popper"` by default): a plain text input sits at the top of
 * `SelectContent` and filters the `SelectItem` list locally. The input stops
 * propagation on keydown so Radix's own roving-focus/typeahead handling on
 * the select content doesn't eat keystrokes meant for the search box, and an
 * effect re-focuses it on open since Radix otherwise focuses the first item.
 *
 * The trigger always shows the placeholder, never "the selected city" - this
 * is a one-shot navigation control, not a persisted filter, so there is
 * nothing meaningful to keep selected after the jump.
 */
export function CitySwitcher({ cities, className }: CitySwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((slug) => humanizeCity(slug).toLowerCase().includes(q));
  }, [cities, search]);

  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearch("");
  }

  function handleSelect(slug: string) {
    setOpen(false);
    setSearch("");
    router.push(`/city/${slug}`);
  }

  return (
    <Select open={open} onOpenChange={handleOpenChange} onValueChange={handleSelect} value="">
      <SelectTrigger
        className={cn("w-full sm:w-64", className)}
        aria-label="Jump to a city"
      >
        <SelectValue placeholder="Jump to a city..." />
      </SelectTrigger>
      <SelectContent className="p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search cities..."
            aria-label="Search cities"
            className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <SelectGroup className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No cities match &ldquo;{search.trim()}&rdquo;
            </p>
          )}
          {filtered.map((slug) => (
            <SelectItem key={slug} value={slug}>
              {humanizeCity(slug)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
