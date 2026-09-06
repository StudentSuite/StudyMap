"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Search, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPlaces } from "@/lib/places";
import { getCompetitions } from "@/lib/competitions";
import { docsPages } from "@/lib/docs-nav";
import { searchSite, searchSiteTotal, type SearchResult, type SearchResultType } from "@/lib/search";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Loaded lazily (see the dynamic import in navbar.tsx) so the place and
 * competition datasets — hundreds of records between them — aren't part of
 * every page's initial JS, only fetched the first time someone opens search.
 * Matches how map/places-map.tsx code-splits the Leaflet map view.
 */

const GROUP_ICON: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  place: MapPin,
  competition: Trophy,
  doc: BookOpen,
};

/** "See all" destination for a group whose matches exceed the per-group cap. Docs has no search route to link to, so it gets none. */
function seeAllHref(type: SearchResultType, query: string): string | null {
  const q = encodeURIComponent(query);
  if (type === "place") return `/map?q=${q}`;
  if (type === "competition") return `/competitions?q=${q}`;
  return null;
}

interface SiteSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiteSearchDialog({ open, onOpenChange }: SiteSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search StudyMap</DialogTitle>
        {/* Mounted fresh each time the dialog opens, so its query/selection
            state resets for free — no reset effect needed. */}
        {open && <SiteSearchPanel onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

interface SiteSearchPanelProps {
  onOpenChange: (open: boolean) => void;
}

function SiteSearchPanel({ onOpenChange }: SiteSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Data is static for the lifetime of the tab (it's rebuilt with the app),
  // so read it once rather than on every render.
  const places = React.useMemo(() => getPlaces(), []);
  const competitions = React.useMemo(() => getCompetitions(), []);
  const docs = React.useMemo(() => docsPages, []);

  const groups = React.useMemo(
    () => searchSite(query, { places, competitions, docs }),
    [query, places, competitions, docs],
  );
  const total = searchSiteTotal(groups);
  const flatResults = React.useMemo(() => groups.flatMap((group) => group.results), [groups]);
  // Row index of each result, keyed by its result key, so the JSX below can
  // look up "am I the active row" without a mutable counter across renders.
  const indexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((result, i) => map.set(`${result.type}-${result.id}`, i));
    return map;
  }, [flatResults]);

  React.useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  function updateQuery(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function go(result: SearchResult) {
    onOpenChange(false);
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = flatResults[activeIndex];
      if (result) go(result);
    }
  }

  return (
    <>
      <div className="relative border-b border-border">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search places, competitions, and docs..."
          aria-label="Search StudyMap"
          className="h-12 w-full bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {query.trim() === "" && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Search places, competitions, and docs.
          </p>
        )}

        {query.trim() !== "" && total === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {groups.map((group) => {
          const Icon = GROUP_ICON[group.type];
          const seeAll = group.total > group.results.length ? seeAllHref(group.type, query.trim()) : null;
          return (
            <div key={group.type} className="mb-2 last:mb-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" />
                {group.label}
              </div>
              <ul>
                {group.results.map((result) => {
                  const key = `${result.type}-${result.id}`;
                  const rowIndex = indexByKey.get(key) ?? -1;
                  const isActive = rowIndex === activeIndex;
                  return (
                    <li key={key}>
                      <Link
                        href={result.href}
                        onClick={() => onOpenChange(false)}
                        onMouseEnter={() => setActiveIndex(rowIndex)}
                        className={cn(
                          "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive ? "bg-muted text-foreground" : "text-foreground hover:bg-muted",
                        )}
                      >
                        <span className="font-medium">{result.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{result.subtitle}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {seeAll && (
                <Link
                  href={seeAll}
                  onClick={() => onOpenChange(false)}
                  className="block rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:underline"
                >
                  See all {group.total} results
                </Link>
              )}
              {!seeAll && group.total > group.results.length && (
                <p className="px-3 py-1.5 text-xs text-muted-foreground">
                  and {group.total - group.results.length} more
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden items-center gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">&uarr;</kbd>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">&darr;</kbd>
          to navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">&crarr;</kbd>
          to select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">esc</kbd>
          to close
        </span>
      </div>
    </>
  );
}
