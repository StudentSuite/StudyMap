import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasCurrentVerification, verifiedUntil } from "@/lib/verification";
import {
  COMPETITION_CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  type Competition,
  type Place,
} from "@/lib/types";

// Not yet wired to a gated admin route: this app has no role/is_admin system
// today (verified against supabase/migrations/*.sql and user_profiles), so
// this takes its records as a prop rather than assuming a protected page.

const EXPIRING_SOON_DAYS = 30;

function recordLabel(record: Place | Competition): string {
  return "type" in record
    ? PLACE_TYPE_LABELS[record.type]
    : COMPETITION_CATEGORY_LABELS[record.category];
}

/** Whole days from `now` to `dateIso` (negative once it's in the past). */
function daysUntil(dateIso: string, now: Date): number {
  const target = Date.parse(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

interface Buckets {
  neverVerified: (Place | Competition)[];
  expiringSoon: (Place | Competition)[];
  current: (Place | Competition)[];
}

/**
 * Three buckets: never verified, expiring within EXPIRING_SOON_DAYS, or
 * current. A record whose verification exists but has already fallen
 * outside its window (hasCurrentVerification false, verified set) is folded
 * into "never verified": it needs a fresh check right now, same as a record
 * with no verification at all, which is a stronger signal than "expiring
 * soon".
 */
function bucketRecords(records: (Place | Competition)[], now: Date): Buckets {
  const neverVerified: (Place | Competition)[] = [];
  const expiringSoon: (Place | Competition)[] = [];
  const current: (Place | Competition)[] = [];

  for (const record of records) {
    if (!hasCurrentVerification(record, now)) {
      neverVerified.push(record);
      continue;
    }
    const until = verifiedUntil(record);
    const days = until ? daysUntil(until, now) : Number.POSITIVE_INFINITY;
    if (days <= EXPIRING_SOON_DAYS) {
      expiringSoon.push(record);
    } else {
      current.push(record);
    }
  }

  return { neverVerified, expiringSoon, current };
}

function QueueList({
  title,
  records,
  limit,
}: {
  title: string;
  records: (Place | Competition)[];
  limit: number;
}) {
  if (records.length === 0) return null;
  const shown = records.slice(0, limit);
  const remaining = records.length - shown.length;

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {title} ({records.length})
      </div>
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2 text-sm">
        {shown.map((record) => (
          <li key={record.id} className="flex items-center justify-between gap-2">
            <span className="truncate">{record.name}</span>
            <Badge variant="outline" className="shrink-0">
              {recordLabel(record)}
            </Badge>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">+{remaining} more</div>
      )}
    </div>
  );
}

/**
 * Summarizes a maintainer's verification backlog across places and
 * competitions: counts in each bucket, plus scrollable lists of the two
 * buckets that need action (never verified, expiring soon).
 */
export function VerificationQueueCard({
  records,
  limit = 20,
}: {
  records: (Place | Competition)[];
  limit?: number;
}) {
  const now = new Date();
  const { neverVerified, expiringSoon, current } = bucketRecords(records, now);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification queue</CardTitle>
        <CardDescription>
          {records.length} record{records.length === 1 ? "" : "s"} checked against their
          verification window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-2">
            <div className="text-lg font-semibold text-destructive">{neverVerified.length}</div>
            <div className="text-xs text-muted-foreground">Never verified</div>
          </div>
          <div className="rounded-lg border border-warning/25 bg-warning/10 p-2">
            <div className="text-lg font-semibold text-warning">{expiringSoon.length}</div>
            <div className="text-xs text-muted-foreground">Expiring soon</div>
          </div>
          <div className="rounded-lg border border-success/25 bg-success/10 p-2">
            <div className="text-lg font-semibold text-success">{current.length}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
        </div>

        <QueueList title="Never verified" records={neverVerified} limit={limit} />
        <QueueList title="Expiring soon" records={expiringSoon} limit={limit} />
      </CardContent>
    </Card>
  );
}
