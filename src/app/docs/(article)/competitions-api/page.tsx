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
import { COMPETITIONS_API_LIMITS } from "@/lib/competitions-api";

export const metadata: Metadata = {
  title: "Competitions API",
  description:
    "Read StudyMap's competitions dataset programmatically: GET /api/competitions, filters, pagination, and errors.",
};

const RESPONSE_EXAMPLE = `{
  "data": [
    {
      "id": "breakthrough-junior-challenge",
      "name": "Breakthrough Junior Challenge",
      "organizer": "Breakthrough Prize Foundation",
      "organizer_url": "https://breakthroughjuniorchallenge.org",
      "category": "stem",
      "subjects": ["physics", "science communication"],
      "description": "One to three sentences, written by us.",
      "format": "online",
      "age_min": 13,
      "age_max": 18,
      "participation": "individual",
      "region": "international",
      "fee": { "amount": 0, "currency": "USD" },
      "prize": "USD 250,000 scholarship plus a lab grant",
      "official_url": "https://breakthroughjuniorchallenge.org",
      "cycle_year": 2026,
      "dates": [
        {
          "label": "Submission deadline",
          "date": "2026-06-25",
          "type": "deadline",
          "timezone": "UTC-4",
          "estimated": false,
          "source_url": "https://breakthroughjuniorchallenge.org/rules"
        }
      ],
      "added_by": "your-github-username"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}`;

const ERROR_EXAMPLE = `{
  "error": "unknown country \\"ZZ\\"; expected one of IN, US, GB, CA, AU, SG, DE, FR, CN, JP, KR, BR, ZA"
}`;

const FILTERS: { name: string; type: string; notes: string }[] = [
  {
    name: "category",
    type: "enum",
    notes:
      "One of the 15 competition categories (stem, mathematics, coding, essay_writing, and so on). Anything else is a 400.",
  },
  {
    name: "format",
    type: "enum",
    notes: "One of `online`, `in_person`, `hybrid`.",
  },
  {
    name: "participation",
    type: "enum",
    notes: "One of `individual`, `team`, `individual_or_team`.",
  },
  {
    name: "region",
    type: "string",
    notes:
      'Matched exactly as stored: `"international"`, or an ISO-3166 alpha-2 code like `US`. Free-form, not a fixed enum, so it is not validated against a list - a region with no matches just returns an empty `data` array.',
  },
  {
    name: "country",
    type: "enum",
    notes:
      'Matches `country_tracks[].country`: one of the 13 countries with a real qualifying pathway (IN, US, GB, CA, AU, SG, DE, FR, CN, JP, KR, BR, ZA). Unlike the places API, where `country` is rejected outright because that dataset has no such field, this filter genuinely works here.',
  },
  {
    name: "fee",
    type: '"free"',
    notes:
      "Only accepted value is `free`, which keeps competitions with a fee of zero. Any other value is a 400.",
  },
  {
    name: "age",
    type: "non-negative integer",
    notes: "Kept only when the age falls within the competition's own age_min/age_max, inclusive at both ends.",
  },
  {
    name: "deadline_before",
    type: "ISO date (YYYY-MM-DD)",
    notes: 'Keeps competitions with at least one `dates[]` entry of type `"deadline"` on or before this date.',
  },
  {
    name: "limit",
    type: "positive integer",
    notes: `Default ${COMPETITIONS_API_LIMITS.defaultLimit}; values above the hard maximum of ${COMPETITIONS_API_LIMITS.maxLimit} are clamped, never dumped.`,
  },
  {
    name: "offset",
    type: "non-negative integer",
    notes: "Zero-based. Combine with `limit` to page through results.",
  },
];

export default function CompetitionsApiPage() {
  return (
    <div className="space-y-6">
      <p className="text-foreground/80">
        Every competition StudyMap lists is hand-curated and committed to{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          data/competitions/*.json
        </code>{" "}
        - one file per category, including the real national qualifying pathways in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">country_tracks</code>{" "}
        where one exists. The API below exposes that dataset read-only, mirroring the{" "}
        <Link href="/docs/places-api" className="font-medium text-primary hover:underline">
          places API
        </Link>{" "}
        exactly, so anything can be built on top of it without cloning the repo.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>GET /api/competitions</CardTitle>
          <CardDescription>
            The merged dataset, optionally filtered, with bounded pagination.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            lang="bash"
            code={`# Everything (paginated at ${COMPETITIONS_API_LIMITS.defaultLimit} rows)
curl "https://studyymap.com/api/competitions"

# Free, individual STEM competitions
curl "https://studyymap.com/api/competitions?category=stem&participation=individual&fee=free"

# Competitions with a real qualifying pathway for India
curl "https://studyymap.com/api/competitions?country=IN"`}
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
              data/competitions/*.json
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
              href="https://github.com/StudentSuite/StudyMap/blob/main/data/competitions.schema.json"
              className="font-medium text-primary hover:underline"
            >
              data/competitions.schema.json
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
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">format</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">participation</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">country</code>, or{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">fee</code> value; a
            malformed <code className="rounded bg-muted px-1.5 py-0.5 font-mono">age</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">deadline_before</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">limit</code>, or{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">offset</code>; or a
            repeated parameter. A filter combination with no matches is an empty
            result, not an error.
          </p>
        </CardContent>
      </Card>

      <CalloutCard title="No API key, no write access">
        This endpoint is read-only and deliberately unauthenticated - the
        dataset is public by design. To add or correct a competition, open a
        pull request against{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          data/competitions/*.json
        </code>{" "}
        following the{" "}
        <a
          href="https://github.com/StudentSuite/StudyMap/blob/main/data/competitions/CONTRIBUTING.md"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          competitions contributing guide
        </a>
        .
      </CalloutCard>
    </div>
  );
}
