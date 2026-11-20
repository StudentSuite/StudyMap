"use client";

import { useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import type { CompetitionGrouping, PlaceGrouping, SiteStats, StatRow } from "@/lib/stats";
import { formatCount } from "@/lib/format";

type Dataset = "places" | "competitions";
type ViewKind = "bars" | "table";

/** Bars stop here: ranked bars read best short. The table lists everything. */
const TOP_N = 10;
/** Bar length is capped so the value printed at its tip always fits in the row. */
const MAX_BAR_PERCENT = 88;

const DATASET_OPTIONS: SegmentedOption<Dataset>[] = [
  { value: "places", label: "Places" },
  { value: "competitions", label: "Competitions" },
];

const PLACE_GROUP_OPTIONS: SegmentedOption<PlaceGrouping>[] = [
  { value: "category", label: "Category" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
];

const COMPETITION_GROUP_OPTIONS: SegmentedOption<CompetitionGrouping>[] = [
  { value: "category", label: "Category" },
  { value: "region", label: "Region" },
];

const VIEW_OPTIONS: SegmentedOption<ViewKind>[] = [
  { value: "bars", label: "Bars", icon: ChartColumn },
  { value: "table", label: "Table", icon: Table2 },
];

/** What one group is called, singular and plural, for titles and notes. */
const GROUP_NOUNS: Record<string, { singular: string; plural: string }> = {
  category: { singular: "category", plural: "categories" },
  country: { singular: "country", plural: "countries" },
  city: { singular: "city", plural: "cities" },
  region: { singular: "region", plural: "regions" },
};

function percent(count: number, total: number): string {
  if (total <= 0) return "0%";
  const value = (count / total) * 100;
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10}%`;
}

function RankedBars({ rows, unit }: { rows: StatRow[]; unit: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.key}
          className="grid grid-cols-[7.5rem_1fr] items-center gap-3 rounded-md px-1 py-0.5 hover:bg-muted/60 sm:grid-cols-[11rem_1fr]"
          title={`${row.label}: ${formatCount(row.count)} ${unit}`}
        >
          <span className="text-sm leading-snug text-foreground/80">{row.label}</span>
          <div className="flex items-center gap-2">
            <div
              className="h-5 min-w-0.5 rounded-r-[4px]"
              style={{
                width: `${(row.count / max) * MAX_BAR_PERCENT}%`,
                background: "var(--viz-1)",
              }}
            />
            <span className="text-sm font-semibold tabular-nums">
              {formatCount(row.count)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function RankedTable({
  rows,
  groupLabel,
  unit,
  total,
}: {
  rows: StatRow[];
  groupLabel: string;
  unit: string;
  total: number;
}) {
  return (
    <div className="max-h-96 overflow-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {unit} by {groupLabel}
        </caption>
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border">
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
            >
              {groupLabel}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              {unit}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-medium">
                {row.label}
              </th>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCount(row.count)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {percent(row.count, total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StatsExplorerProps {
  stats: SiteStats;
}

export function StatsExplorer({ stats }: StatsExplorerProps) {
  const [dataset, setDataset] = useState<Dataset>("places");
  const [placeGroup, setPlaceGroup] = useState<PlaceGrouping>("category");
  const [competitionGroup, setCompetitionGroup] =
    useState<CompetitionGrouping>("category");
  const [view, setView] = useState<ViewKind>("bars");

  const isPlaces = dataset === "places";
  const group: string = isPlaces ? placeGroup : competitionGroup;
  const rows: StatRow[] = isPlaces
    ? stats.places[placeGroup]
    : stats.competitions[competitionGroup];
  const total = isPlaces ? stats.placeCount : stats.competitionCount;
  const unit = isPlaces ? "Places" : "Competitions";
  const noun = GROUP_NOUNS[group];
  const groupLabel = noun.singular.charAt(0).toUpperCase() + noun.singular.slice(1);

  const shown = rows.slice(0, TOP_N);
  const trimmed = rows.length > shown.length;

  return (
    <section aria-label="Dataset breakdown" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Segmented
          label="Dataset"
          value={dataset}
          options={DATASET_OPTIONS}
          onChange={setDataset}
        />
        {isPlaces ? (
          <Segmented
            label="Group by"
            value={placeGroup}
            options={PLACE_GROUP_OPTIONS}
            onChange={setPlaceGroup}
          />
        ) : (
          <Segmented
            label="Group by"
            value={competitionGroup}
            options={COMPETITION_GROUP_OPTIONS}
            onChange={setCompetitionGroup}
          />
        )}
        <Segmented label="View" value={view} options={VIEW_OPTIONS} onChange={setView} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {unit} by {noun.singular}
          </CardTitle>
          <CardDescription>
            {formatCount(total)} {unit.toLowerCase()} across {formatCount(rows.length)}{" "}
            {rows.length === 1 ? noun.singular : noun.plural}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
          ) : view === "bars" ? (
            <>
              <RankedBars rows={shown} unit={unit.toLowerCase()} />
              {trimmed && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Showing the top {shown.length} of {formatCount(rows.length)}{" "}
                  {noun.plural}. Switch to Table to see all of them.
                </p>
              )}
            </>
          ) : (
            <RankedTable rows={rows} groupLabel={groupLabel} unit={unit} total={total} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
