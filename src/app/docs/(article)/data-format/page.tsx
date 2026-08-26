import type { Metadata } from "next";
import Link from "next/link";

import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import placesSchema from "../../../../../data/places.schema.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/docs/code-block";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Place Data Format",
  description:
    "The JSON schema for data/places/*.json: every field, the id-prefix convention, and the 6 place types.",
};

const EXAMPLE = `{
  "id": "mum-library-07",
  "name": "City Library, Dadar branch",
  "type": "library",
  "city": "mumbai",
  "lat": 19.0176,
  "lng": 72.8562,
  "address": "Gate 2, Gokhale Road, Dadar West",
  "gmaps_link": "https://maps.app.goo.gl/xxxx",
  "added_by": "your-github-handle"
}`;

const REQUIRED = new Set<string>(placesSchema.required);

/** Falls back to a synthesized note for fields the schema doesn't annotate with prose. */
function fieldDescription(name: string, field: Record<string, unknown>): string {
  if (typeof field.description === "string") return field.description;
  if (typeof field.minimum === "number" && typeof field.maximum === "number") {
    return `Range: ${field.minimum} to ${field.maximum}.`;
  }
  if (name === "gmaps_link") {
    return "A Google Maps link (maps.google.com, maps.app.goo.gl, or a full google.com/maps URL).";
  }
  return "";
}

export default function DataFormatPage() {
  const fields = Object.entries(placesSchema.properties);

  return (
    <>
      <p className="mb-6 text-foreground/80">
        The JSON schema behind every entry in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
          data/places/&lt;type&gt;.json
        </code>
        . For the GitHub issue/PR process itself, see{" "}
        <Link href="/docs/contributing" className="font-medium text-primary hover:underline">
          Contributing Places
        </Link>{" "}
        instead - this page is only about the data shape.
      </p>
      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>The 6 place types</CardTitle>
              <CardDescription>One JSON file per type, under data/places/</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">File</th>
                      <th className="py-2 pr-4 font-medium">Type key</th>
                      <th className="py-2 font-medium">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLACE_TYPES.map((type) => (
                      <tr key={type} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{type}.json</td>
                        <td className="py-2 pr-4 font-mono text-xs">{type}</td>
                        <td className="py-2 text-foreground/80">{PLACE_TYPE_LABELS[type]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
              <CardDescription>
                Generated from data/places.schema.json, the file{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  scripts/validate-places.mjs
                </code>{" "}
                validates every record against
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map(([name, field]) => (
                <div key={name} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{name}</code>
                  <span className="text-xs text-muted-foreground">
                    {(field as { type: string }).type}
                  </span>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {REQUIRED.has(name) ? "required" : "optional"}
                  </Badge>
                  {fieldDescription(name, field as Record<string, unknown>) && (
                    <span className="w-full text-foreground/80">
                      {fieldDescription(name, field as Record<string, unknown>)}
                    </span>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Nothing outside this list is allowed on a committed record - proof of
                quality (source, rating, review count, verified date) goes in the pull
                request only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Example record</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code={EXAMPLE} lang="json" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ID prefix convention</CardTitle>
              <CardDescription>&lt;city-prefix&gt;-&lt;type&gt;-&lt;number&gt;</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/80">
              <p>
                The prefix is a short slug for the city (e.g.{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">mum</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">thane</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">jkt</code>),
                and the number increments from the highest one already used for that
                prefix in the same file - never reuse an ID.
              </p>
              <p className="text-xs text-muted-foreground">
                A handful of older bulk-imported entries don&apos;t follow this exact
                format (see{" "}
                <Link href="/docs/data-sources" className="font-medium text-primary hover:underline">
                  Data Sources &amp; Provenance
                </Link>
                ), but every new place should.
              </p>
            </CardContent>
          </Card>
        </div>

        <CalloutCard
          title="Adding a new field?"
          description="Update the schema, not just the docs"
          className="mt-4"
        >
          <p>
            If a place type ever needs a new field, add it to{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              data/places.schema.json
            </code>{" "}
            first. This page and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              scripts/validate-places.mjs
            </code>{" "}
            read that file directly, so they update automatically - only{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              data/CONTRIBUTING.md
            </code>{" "}
            needs a manual edit to match.
          </p>
        </CalloutCard>
    </>
  );
}
