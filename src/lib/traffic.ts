/**
 * Monthly site traffic shown on /traffic.
 *
 * One row per calendar month, oldest first. To add a month, append a row:
 * the page, chart, stats and table all derive from this array.
 */
export interface TrafficMonth {
  /** Calendar month as "YYYY-MM". */
  month: string;
  /** Unique visitors in the month. */
  visitors: number;
  /** Total page views in the month. */
  pageViews: number;
}

export const trafficMonths: readonly TrafficMonth[] = [
  { month: "2026-10", visitors: 1133, pageViews: 2931 },
];

export type TrafficMetric = "visitors" | "pageViews";

export const TRAFFIC_METRICS: readonly {
  key: TrafficMetric;
  label: string;
}[] = [
  { key: "visitors", label: "Visitors" },
  { key: "pageViews", label: "Page views" },
];

/** "Visitors", or "Visitors and page views": only the first label keeps its capital. */
export function joinMetricLabels(metrics: readonly TrafficMetric[]): string {
  return TRAFFIC_METRICS.filter((m) => metrics.includes(m.key))
    .map((m, i) => (i === 0 ? m.label : m.label.toLowerCase()))
    .join(" and ");
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Parses "YYYY-MM" into a UTC date, or null when the key is malformed. */
function parseMonth(month: string): Date | null {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

/**
 * Human label for a "YYYY-MM" key. Formatted in UTC so a viewer's timezone
 * can never shift the first of the month into the previous one.
 * "long" -> "October 2026", "medium" -> "Oct 2026", "short" -> "Oct 26".
 */
export function formatMonth(month: string, style: "long" | "medium" | "short"): string {
  const date = parseMonth(month);
  if (!date) return month;
  if (style === "short") {
    const name = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(date);
    return `${name} ${String(date.getUTCFullYear()).slice(2)}`;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Pages viewed per visitor, or null when there were no visitors. */
export function pagesPerVisitor(row: TrafficMonth): number | null {
  return row.visitors > 0 ? row.pageViews / row.visitors : null;
}

/** Running totals: each row holds the sum of itself and every earlier row. */
export function toRunningTotal(rows: readonly TrafficMonth[]): TrafficMonth[] {
  let visitors = 0;
  let pageViews = 0;
  return rows.map((row) => {
    visitors += row.visitors;
    pageViews += row.pageViews;
    return { month: row.month, visitors, pageViews };
  });
}

/**
 * Percent change from `previous` to `current`. Null when there is no
 * previous value to compare against (first month, or a zero baseline).
 */
export function percentChange(
  current: number,
  previous: number | undefined,
): number | null {
  if (previous === undefined || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export { formatCount } from "@/lib/format";
