"use client";

import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import type { DeadlineWindow } from "@/components/competitions/filters";
import {
  activeFilterCount,
  type CompetitionFilterState,
} from "@/components/competitions/filters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMPETITION_FORMAT_LABELS,
  COMPETITION_FORMATS,
  COMPETITION_PARTICIPATION_LABELS,
  COMPETITION_PARTICIPATION_TYPES,
  humanizeRegion,
} from "@/lib/types";
import type { CompetitionFormat, CompetitionParticipation } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEADLINE_WINDOW_LABELS: Record<DeadlineWindow, string> = {
  "30": "Next 30 days",
  "90": "Next 90 days",
  cycle: "This cycle",
};

function Pill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        pressed
          ? "bg-primary/10 text-primary ring-1 ring-primary"
          : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface CompetitionFiltersPanelProps {
  filters: CompetitionFilterState;
  onChange: (next: CompetitionFilterState) => void;
  regions: string[];
}

/**
 * Collapsible panel for everything besides the always-visible category
 * chips: format, participation, region, fee, age, and deadline window. The
 * trigger shows an active-filter count so a user can see at a glance
 * whether a filter is on without opening the panel.
 */
export function CompetitionFiltersPanel({
  filters,
  onChange,
  regions,
}: CompetitionFiltersPanelProps) {
  const count = activeFilterCount(filters);

  function set<K extends keyof CompetitionFilterState>(
    key: K,
    value: CompetitionFilterState[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  function toggle<K extends keyof CompetitionFilterState>(
    key: K,
    value: CompetitionFilterState[K],
  ) {
    set(key, filters[key] === value ? (null as CompetitionFilterState[K]) : value);
  }

  return (
    <CollapsiblePrimitive.Root className="rounded-xl bg-muted/30">
      <CollapsiblePrimitive.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors rounded-xl"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>Filters</span>
            {count > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content className="space-y-4 border-t border-border px-4 py-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Format</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by format"
          >
            {COMPETITION_FORMATS.map((format) => (
              <Pill
                key={format}
                pressed={filters.format === format}
                onClick={() => toggle("format", format as CompetitionFormat)}
              >
                {COMPETITION_FORMAT_LABELS[format]}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Participation
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by participation"
          >
            {COMPETITION_PARTICIPATION_TYPES.map((participation) => (
              <Pill
                key={participation}
                pressed={filters.participation === participation}
                onClick={() =>
                  toggle("participation", participation as CompetitionParticipation)
                }
              >
                {COMPETITION_PARTICIPATION_LABELS[participation]}
              </Pill>
            ))}
          </div>
        </div>

        {regions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Region</p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by region"
            >
              {regions.map((region) => (
                <Pill
                  key={region}
                  pressed={filters.region === region}
                  onClick={() => toggle("region", region)}
                >
                  {humanizeRegion(region)}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fee</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by fee">
            <Pill
              pressed={filters.freeOnly}
              onClick={() => set("freeOnly", !filters.freeOnly)}
            >
              Free only
            </Pill>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Deadline window
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by deadline window"
          >
            {(Object.keys(DEADLINE_WINDOW_LABELS) as DeadlineWindow[]).map((window) => (
              <Pill
                key={window}
                pressed={filters.deadlineWindow === window}
                onClick={() => toggle("deadlineWindow", window)}
              >
                {DEADLINE_WINDOW_LABELS[window]}
              </Pill>
            ))}
          </div>
        </div>

        <div className="max-w-[10rem]">
          <Label
            htmlFor="competition-age-filter"
            className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Age
          </Label>
          <Input
            id="competition-age-filter"
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            value={filters.age ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              set("age", raw === "" ? null : Number(raw));
            }}
            placeholder="Any age"
            className="h-9"
          />
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
