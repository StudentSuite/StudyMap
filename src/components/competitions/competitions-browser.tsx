"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";

import { CompetitionFiltersPanel } from "@/components/competitions/competition-filters";
import { CompetitionCard } from "@/components/competitions/competition-card";
import type { CompetitionFilterState } from "@/components/competitions/filters";
import { activeFilterCount } from "@/components/competitions/filters";
import { useViewMode, ViewToggle } from "@/components/competitions/view-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchSaveCounts, fetchSavedCompetitionIds } from "@/lib/competition-saves";
import { filterCompetitions, sortByNextDate, nextDate } from "@/lib/competitions";
import { competitionFiltersToSearch } from "@/lib/competitions-share";
import { createClient } from "@/lib/supabase/client";
import {
  COMPETITION_CATEGORIES,
  COMPETITION_CATEGORY_LABELS,
  humanizeRegion,
  COMPETITION_FORMAT_LABELS,
  COMPETITION_PARTICIPATION_LABELS,
} from "@/lib/types";
import type { Competition, CompetitionCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompetitionsBrowserProps {
  competitions: Competition[];
  /** ISO timestamp computed once by the server page, so sorting and the
   * deadline countdowns are consistent between the server render and the
   * client's first paint. */
  nowIso: string;
  initialFilters: CompetitionFilterState;
}

function deadlineWindowCutoff(now: Date, window: "30" | "90"): string {
  const days = window === "30" ? 30 : 90;
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString().slice(0, 10);
}

function describeActiveFilters(filters: CompetitionFilterState): string[] {
  const parts: string[] = [];
  if (filters.categories.length) {
    parts.push(
      `categories: ${filters.categories.map((c) => COMPETITION_CATEGORY_LABELS[c]).join(", ")}`,
    );
  }
  if (filters.format) parts.push(`format: ${COMPETITION_FORMAT_LABELS[filters.format]}`);
  if (filters.participation) {
    parts.push(
      `participation: ${COMPETITION_PARTICIPATION_LABELS[filters.participation]}`,
    );
  }
  if (filters.region) parts.push(`region: ${humanizeRegion(filters.region)}`);
  if (filters.freeOnly) parts.push("free only");
  if (filters.age !== null) parts.push(`age: ${filters.age}`);
  if (filters.deadlineWindow) {
    parts.push(
      `deadline: ${filters.deadlineWindow === "cycle" ? "this cycle" : `next ${filters.deadlineWindow} days`}`,
    );
  }
  if (filters.query) parts.push(`search: "${filters.query}"`);
  return parts;
}

/**
 * The `/competitions` browse experience: search, always-visible category
 * chips, a collapsible filter panel, and a deadline-sorted card grid. All
 * filter state lives in the URL (see src/lib/competitions-share.ts), so a
 * filtered view is shareable and survives a refresh.
 */
export function CompetitionsBrowser({
  competitions,
  nowIso,
  initialFilters,
}: CompetitionsBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [filters, setFilters] = useState<CompetitionFilterState>(initialFilters);
  const [viewMode, setViewMode] = useViewMode("studymap:competitions-view");

  // Bulk-fetched once for the whole grid, rather than each of the 50 cards'
  // save buttons independently querying the same competition_stats table.
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    fetchSaveCounts()
      .then(setSaveCounts)
      .catch(() => {
        /* counts are decorative; a failed fetch just leaves them hidden */
      });

    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) fetchSavedIdsFor(data.user);
      })
      .catch(() => {});
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) =>
      fetchSavedIdsFor(session?.user ?? null),
    );

    function fetchSavedIdsFor(user: User | null) {
      if (!user) {
        setSavedIds(new Set());
        return;
      }
      fetchSavedCompetitionIds()
        .then((ids) => setSavedIds(new Set(ids)))
        .catch(() => setSavedIds(new Set()));
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const regions = useMemo(() => {
    const present = new Set(competitions.map((c) => c.region));
    present.delete("international");
    return Array.from(present).sort();
  }, [competitions]);

  function updateFilters(next: CompetitionFilterState) {
    setFilters(next);
    const search = competitionFiltersToSearch(next);
    router.replace(`${pathname}${search}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const base = filterCompetitions(competitions, {
      categories: filters.categories.length ? filters.categories : undefined,
      format: filters.format ?? undefined,
      region: filters.region ?? undefined,
      participation: filters.participation ?? undefined,
      feeMax: filters.freeOnly ? 0 : undefined,
      age: filters.age ?? undefined,
      query: filters.query || undefined,
    });

    if (!filters.deadlineWindow) return base;

    if (filters.deadlineWindow === "cycle") {
      return base.filter((c) => {
        const upcoming = nextDate(c, now);
        if (!upcoming) return false;
        return Number(upcoming.date.slice(0, 4)) <= c.cycle_year;
      });
    }

    const cutoff = deadlineWindowCutoff(now, filters.deadlineWindow);
    return base.filter((c) => {
      const upcoming = nextDate(c, now);
      return upcoming !== undefined && upcoming.date <= cutoff;
    });
  }, [competitions, filters, now]);

  const sorted = useMemo(() => sortByNextDate(filtered, now), [filtered, now]);

  function toggleCategory(category: CompetitionCategory) {
    const active = filters.categories.includes(category);
    updateFilters({
      ...filters,
      categories: active
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  }

  function clearAll() {
    updateFilters({
      categories: [],
      format: null,
      participation: null,
      region: null,
      freeOnly: false,
      age: null,
      deadlineWindow: null,
      query: "",
    });
  }

  const activeDescriptions = describeActiveFilters(filters);

  return (
    <div className="space-y-6">
      {/* Search + count + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.query}
            onChange={(event) => updateFilters({ ...filters, query: event.target.value })}
            placeholder="Search competitions..."
            className="h-10 pl-9 text-sm"
            aria-label="Search competitions"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            <span className="text-foreground">{sorted.length}</span> of {competitions.length}
          </p>
          <ViewToggle value={viewMode} onChange={setViewMode} className="ml-auto sm:ml-0" />
        </div>
      </div>

      {/* Category chips: scrollable on mobile, wrap on desktop */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
        role="group"
        aria-label="Filter by category"
      >
        {COMPETITION_CATEGORIES.map((category) => {
          const pressed = filters.categories.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              aria-pressed={pressed}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                pressed
                  ? "bg-primary/15 text-primary ring-1 ring-primary"
                  : "border border-border text-muted-foreground hover:border-foreground/20 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {COMPETITION_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      <CompetitionFiltersPanel
        filters={filters}
        onChange={updateFilters}
        regions={regions}
      />

      {sorted.length === 0 ? (
        <div
          role="status"
          className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {activeDescriptions.length > 0
              ? `No competitions match ${activeDescriptions.join(" · ")}.`
              : "No competitions match."}
          </p>
          {activeFilterCount(filters) +
            filters.categories.length +
            (filters.query ? 1 : 0) >
            0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-5"
          }
        >
          {sorted.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              now={now}
              initialSaved={savedIds.has(competition.id)}
              initialCount={saveCounts[competition.id] ?? 0}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
