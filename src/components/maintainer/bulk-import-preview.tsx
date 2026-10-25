"use client";

import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLACE_TYPES, type Place, type PlaceType } from "@/lib/types";

// Not yet wired to a gated admin route: this app has no role/is_admin system
// today (verified against supabase/migrations/*.sql and user_profiles), so
// this ships as a self-contained preview a maintainer runs by hand until a
// real admin route exists to host it.

const REQUIRED_STRING_FIELDS = ["id", "name", "type", "city", "gmaps_link", "added_by"] as const;
const REQUIRED_NUMBER_FIELDS = ["lat", "lng"] as const;

const TONE_CLASSES = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive",
} as const;

type Tone = keyof typeof TONE_CLASSES;

function isPlaceType(value: unknown): value is PlaceType {
  return typeof value === "string" && (PLACE_TYPES as readonly string[]).includes(value);
}

/**
 * Basic schema validation: missing required field, wrong type, lat/lng out
 * of range, type not one of PLACE_TYPES. Mirrors the required list in
 * data/places.schema.json; format/pattern checks (gmaps_link shape, city
 * slug pattern) are left to the real CI validator, not this preview.
 */
function validateCandidate(raw: unknown): { place: Place } | { errors: string[] } {
  const errors: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { errors: ["not a JSON object"] };
  }
  const record = raw as Record<string, unknown>;

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = record[field];
    if (value === undefined) {
      errors.push(`missing required field "${field}"`);
    } else if (typeof value !== "string") {
      errors.push(`"${field}" must be a string, got ${typeof value}`);
    } else if (value.length === 0) {
      errors.push(`"${field}" must not be empty`);
    }
  }

  for (const field of REQUIRED_NUMBER_FIELDS) {
    const value = record[field];
    if (value === undefined) {
      errors.push(`missing required field "${field}"`);
    } else if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`"${field}" must be a number, got ${typeof value}`);
    }
  }

  if (typeof record.type === "string" && !isPlaceType(record.type)) {
    errors.push(`"type" must be one of: ${PLACE_TYPES.join(", ")} (got "${record.type}")`);
  }

  if (typeof record.lat === "number" && (record.lat < -90 || record.lat > 90)) {
    errors.push(`"lat" out of range (-90 to 90): ${record.lat}`);
  }
  if (typeof record.lng === "number" && (record.lng < -180 || record.lng > 180)) {
    errors.push(`"lng" out of range (-180 to 180): ${record.lng}`);
  }

  if (errors.length > 0) return { errors };
  return { place: record as unknown as Place };
}

interface InvalidRow {
  index: number;
  id?: string;
  errors: string[];
}

interface ConflictRow {
  index: number;
  place: Place;
  reason: string;
}

interface DiffResult {
  fresh: { index: number; place: Place }[];
  conflicts: ConflictRow[];
  invalid: InvalidRow[];
}

/** Diffs pasted candidates against the live dataset by id, and against each other. */
function diffCandidates(candidates: unknown[], existingPlaces: Place[]): DiffResult {
  const existingIds = new Set(existingPlaces.map((place) => place.id));
  const seenInBatch = new Set<string>();

  const fresh: DiffResult["fresh"] = [];
  const conflicts: ConflictRow[] = [];
  const invalid: InvalidRow[] = [];

  candidates.forEach((raw, index) => {
    const result = validateCandidate(raw);
    if ("errors" in result) {
      const rawId =
        typeof raw === "object" && raw !== null && typeof (raw as Record<string, unknown>).id === "string"
          ? ((raw as Record<string, unknown>).id as string)
          : undefined;
      invalid.push({ index, id: rawId, errors: result.errors });
      return;
    }

    const { place } = result;
    if (existingIds.has(place.id)) {
      conflicts.push({ index, place, reason: "conflict - id already exists" });
    } else if (seenInBatch.has(place.id)) {
      conflicts.push({ index, place, reason: "conflict - duplicate id within pasted batch" });
    } else {
      seenInBatch.add(place.id);
      fresh.push({ index, place });
    }
  });

  return { fresh, conflicts, invalid };
}

/**
 * Client-side preview only: a maintainer pastes a JSON array of candidate
 * places, diffs it against the current dataset by id, and sanity-checks it
 * before manually committing the batch. Never writes a file or calls an API.
 */
export function BulkImportPreview({ existingPlaces }: { existingPlaces: Place[] }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handlePreview() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      setResult(null);
      setParseError(error instanceof Error ? error.message : "invalid JSON");
      return;
    }
    if (!Array.isArray(parsed)) {
      setResult(null);
      setParseError("pasted JSON must be an array of place objects");
      return;
    }
    setParseError(null);
    setResult(diffCandidates(parsed, existingPlaces));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bulk import preview</CardTitle>
          <CardDescription>
            Paste a JSON array of candidate places to check against the current dataset (
            {existingPlaces.length} existing place{existingPlaces.length === 1 ? "" : "s"}). This
            only previews the diff, it does not write anything.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder='[{"id": "mum-library-07", "name": "...", "type": "library", "city": "mumbai", "lat": 19.07, "lng": 72.87, "gmaps_link": "https://maps.google.com/...", "added_by": "..."}]'
            rows={10}
            className="w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <div className="flex items-center gap-3">
            <Button onClick={handlePreview} disabled={text.trim().length === 0}>
              Preview diff
            </Button>
            {parseError && <span className="text-sm text-destructive">{parseError}</span>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <DiffGroup
            title="New"
            tone="success"
            count={result.fresh.length}
            rows={result.fresh.map(({ index, place }) => (
              <li key={`${place.id}-${index}`} className="truncate">
                <span className="font-mono text-xs text-muted-foreground">#{index}</span>{" "}
                {place.name} <span className="text-muted-foreground">({place.id})</span>
              </li>
            ))}
          />
          <DiffGroup
            title="Conflicts"
            tone="warning"
            count={result.conflicts.length}
            rows={result.conflicts.map(({ index, place, reason }) => (
              <li key={`${place.id}-${index}`}>
                <span className="font-mono text-xs text-muted-foreground">#{index}</span>{" "}
                {place.name} <span className="text-muted-foreground">({place.id})</span>
                <div className="text-xs text-warning">{reason}</div>
              </li>
            ))}
          />
          <DiffGroup
            title="Invalid"
            tone="destructive"
            count={result.invalid.length}
            rows={result.invalid.map((row) => (
              <li key={row.index}>
                <span className="font-mono text-xs text-muted-foreground">#{row.index}</span>{" "}
                {row.id ?? "(no id)"}
                <ul className="mt-0.5 list-disc pl-4 text-xs text-destructive">
                  {row.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </li>
            ))}
          />
        </div>
      )}
    </div>
  );
}

function DiffGroup({
  title,
  tone,
  count,
  rows,
}: {
  title: string;
  tone: Tone;
  count: number;
  rows: ReactNode[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {title}
          <Badge variant="outline" className={TONE_CLASSES[tone]}>
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">None</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">{rows}</ul>
        )}
      </CardContent>
    </Card>
  );
}
