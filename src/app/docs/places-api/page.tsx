import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/docs/code-block";
import { CalloutCard } from "@/components/docs/callout-card";
import { PLACES_API_LIMITS } from "@/lib/places-api";

export const metadata: Metadata = {
  title: "Places API",
  description:
    "Read StudyMap's crowdsourced places dataset programmatically: GET /api/places, filters, pagination, and errors.",
};

const RESPONSE_EXAMPLE = `{
  "data": [
    {
      "id": "mum-library-01",
      "name": "David Sassoon Library",
      "type": "library",
      "city": "mumbai",
      "lat": 18.9674,
      "lng": 72.8339,
      "address": "Fort, Mumbai 400001",
      "gmaps_link": "https://maps.google.com/?q=18.9674,72.8339",
      "added_by": "thunderblitzyt-eng"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}`;

const ERROR_EXAMPLE = `{
  "error": "unknown category \\"bookshop\\"; expected one of library, other_places, airport, sat_centre, foreign_lang_exam_centre, gov_offices"
}`;

const FILTERS: { name: string; type: string; notes: string }[] = [
  {
    name: "city",
    type: "string",
    notes:
      "Case-insensitive; spaces and hyphens are normalized to the dataset's underscore slugs (e.g. `New Delhi` matches `new delhi`). No matching city returns an empty `data` array.",
  },
  {
    name: "category",
    type: "enum",
    notes:
      "One of `library`, `other_places`, `airport`, `sat_centre`, `foreign_lang_exam_centre`, `gov_offices`. Anything else is a 400.",
  },
  {
    name: "country",
    type: "string",
    notes:
      "Rejected with a 400 today: the dataset schema has no `country` field yet, so no record could satisfy the filter.",
  },
  {
    name: "limit",
    type: "positive integer",
    notes:
      `Default ${PLACES_API_LIMITS.defaultLimit}; values above the hard maximum of ${PLACES_API_LIMITS.maxLimit} are clamped, never dumped.`,
  },
  {
    name: "offset",
    type: "non-negative integer",
    notes: "Zero-based. Combine with `limit` to page through large results.",
  },
];

export default function PlacesApiPage() {
  return (
    <div className="space-y-6">
      <p className="text-foreground/80">
        Every place StudyMap renders is crowdsourced and committed to{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/places/*.json</code>{" "}
        — one file per category. The API below exposes that dataset read-only,
        so anything can be built on top of it without cloning the repo.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>GET /api/places</CardTitle>
          <CardDescription>
            The merged dataset, optionally filtered, with bounded pagination.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            lang="bash"
            code={`# Everything (paginated at ${PLACES_API_LIMITS.defaultLimit} rows)
curl "https://studyymap.com/api/places"

# A city filter - "New Delhi" and "new_delhi" both work
curl "https://studyymap.com/api/places?city=mumbai&limit=5"

# Category + pagination
curl "https://studyymap.com/api/places?category=library&limit=50&offset=100"`}
          />
          <p className="text-sm text-foreground/80">
            Responses are plain JSON with permissive CORS (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              Access-Control-Allow-Origin: *
            </code>
            ), so browser code can call it directly. Responses are cached for 6
            hours (the dataset changes a few times a week at most) via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              Cache-Control
            </code>{" "}
            headers.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Query parameters</CardTitle>
          <CardDescription>
            All optional; every value is validated, and invalid values are a
            400 with a message - never silently ignored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {FILTERS.map((filter) => (
              <li key={filter.name} className="py-3">
                <p className="font-medium">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                    {filter.name}
                  </code>{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filter.type})
                  </span>
                </p>
                <p className="mt-1 text-sm text-foreground/80">{filter.notes}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response shape</CardTitle>
          <CardDescription>
            Each record is exactly one entry from{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              data/places/*.json
            </code>
            , as defined by the schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock lang="json" code={RESPONSE_EXAMPLE} />
          <p className="text-sm text-foreground/80">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">total</code>{" "}
            is the number of matches before pagination, so consumers know the
            full result set size. The canonical record shape lives in{" "}
            <Link
              href="https://github.com/StudentSuite/StudyMap/blob/main/data/places.schema.json"
              className="font-medium text-primary hover:underline"
            >
              data/places.schema.json
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Errors</CardTitle>
          <CardDescription>
            Invalid filter values return 400 with an{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">error</code>{" "}
            message instead of being ignored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock lang="json" code={ERROR_EXAMPLE} />
          <p className="text-sm text-foreground/80">
            400 cases: an unknown <code className="rounded bg-muted px-1.5 py-0.5 font-mono">category</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">country</code>{" "}
            (no country data in the schema yet), a non-integer{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">limit</code>{" "}
            or <code className="rounded bg-muted px-1.5 py-0.5 font-mono">offset</code>, or
            a repeated parameter. A <code className="rounded bg-muted px-1.5 py-0.5 font-mono">city</code>{" "}
            with no places is an empty result, not an error.
          </p>
        </CardContent>
      </Card>

      <CalloutCard title="No API key, no write access">
        This endpoint is read-only and deliberately unauthenticated - the
        dataset is public by design. To add or correct a place, open a pull
        request against <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/places/*.json</code>{" "}
        following the{" "}
        <Link href="/docs/contributing" className="font-medium text-primary hover:underline">
          contributing guide
        </Link>
        .
      </CalloutCard>
    </div>
  );
}
