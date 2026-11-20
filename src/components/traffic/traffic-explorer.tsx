"use client";

import { useState, type ReactNode } from "react";
import { ChartArea, ChartColumn, ChartLine, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import {
  TRAFFIC_METRICS,
  formatCount,
  formatMonth,
  joinMetricLabels,
  pagesPerVisitor,
  toRunningTotal,
  type TrafficMetric,
  type TrafficMonth,
} from "@/lib/traffic";
import { SERIES_COLOR, TrafficChart, type ChartKind } from "./traffic-chart";

type ViewKind = ChartKind | "table";
type MetricChoice = "both" | TrafficMetric;
type ValueMode = "monthly" | "running";

const VIEW_OPTIONS: SegmentedOption<ViewKind>[] = [
  { value: "bars", label: "Bars", icon: ChartColumn },
  { value: "line", label: "Line", icon: ChartLine },
  { value: "area", label: "Area", icon: ChartArea },
  { value: "table", label: "Table", icon: Table2 },
];

const METRIC_OPTIONS: SegmentedOption<MetricChoice>[] = [
  { value: "both", label: "Both" },
  { value: "visitors", label: "Visitors" },
  { value: "pageViews", label: "Page views" },
];

const VALUE_OPTIONS: SegmentedOption<ValueMode>[] = [
  { value: "monthly", label: "Monthly" },
  { value: "running", label: "Running total" },
];

function Th({
  children,
  align = "right",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2 text-xs font-medium text-muted-foreground",
        align === "left" ? "text-left" : "text-right",
      )}
    >
      {children}
    </th>
  );
}

interface TrafficExplorerProps {
  months: readonly TrafficMonth[];
}

export function TrafficExplorer({ months }: TrafficExplorerProps) {
  const [view, setView] = useState<ViewKind>("bars");
  const [metric, setMetric] = useState<MetricChoice>("both");
  const [valueMode, setValueMode] = useState<ValueMode>("monthly");

  const rows = valueMode === "running" ? toRunningTotal(months) : months;
  const metrics: TrafficMetric[] =
    metric === "both" ? ["visitors", "pageViews"] : [metric];
  const metricLabels = joinMetricLabels(metrics);

  const first = months[0];
  const lastMonth = months[months.length - 1];
  const range =
    !first || !lastMonth
      ? ""
      : first.month === lastMonth.month
        ? formatMonth(first.month, "long")
        : `${formatMonth(first.month, "medium")} to ${formatMonth(lastMonth.month, "medium")}`;

  const showTable = view === "table";
  const tableRows = [...rows].reverse(); // newest first

  return (
    <section aria-label="Traffic chart" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Segmented label="Chart" value={view} options={VIEW_OPTIONS} onChange={setView} />
        <Segmented
          label="Show"
          value={metric}
          options={METRIC_OPTIONS}
          onChange={setMetric}
        />
        <Segmented
          label="Values"
          value={valueMode}
          options={VALUE_OPTIONS}
          onChange={setValueMode}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{metricLabels} per month</CardTitle>
          <CardDescription>
            {range}
            {valueMode === "running" ? ", running total" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showTable && (
            <TrafficChart
              rows={rows}
              metrics={metrics}
              kind={view as ChartKind}
              valueLabel={valueMode === "running" ? "Running total" : undefined}
            />
          )}

          {valueMode === "running" && metrics.includes("visitors") && (
            <p className="mt-2 text-xs text-muted-foreground">
              Visitors are unique within each month, so a returning visitor is counted
              once per month in the running total.
            </p>
          )}

          {/* Table view: the visible twin when chosen, screen-reader-only otherwise. */}
          <div className={cn(!showTable && "sr-only", "overflow-x-auto")}>
            <table className="w-full text-sm">
              <caption className="sr-only">
                {metricLabels} per month
                {valueMode === "running" ? ", running total" : ""}
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <Th align="left">Month</Th>
                  {TRAFFIC_METRICS.filter((m) => metrics.includes(m.key)).map((m) => (
                    <Th key={m.key}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block size-2.5 rounded-xs"
                          style={{ background: SERIES_COLOR[m.key] }}
                        />
                        {m.label}
                      </span>
                    </Th>
                  ))}
                  {metric === "both" && <Th>Pages per visitor</Th>}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  const ratio = pagesPerVisitor(row);
                  return (
                    <tr key={row.month} className="border-b border-border last:border-0">
                      <th scope="row" className="px-3 py-2 text-left font-medium">
                        {formatMonth(row.month, "long")}
                      </th>
                      {metrics.map((key) => (
                        <td key={key} className="px-3 py-2 text-right tabular-nums">
                          {formatCount(row[key])}
                        </td>
                      ))}
                      {metric === "both" && (
                        <td className="px-3 py-2 text-right tabular-nums">
                          {ratio === null ? "n/a" : ratio.toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
