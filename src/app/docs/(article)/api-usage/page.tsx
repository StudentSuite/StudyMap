import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalloutCard } from "@/components/docs/callout-card";
import { PLACES_API_LIMITS } from "@/lib/places-api";
import { COMPETITIONS_API_LIMITS } from "@/lib/competitions-api";

export const metadata: Metadata = {
  title: "API Usage & Limits",
  description:
    "What actually bounds GET /api/places and GET /api/competitions: pagination caps and response caching. No API key, and no rate limiting today.",
};

export default function ApiUsagePage() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-foreground/80">
          Both{" "}
          <Link
            href="/docs/places-api"
            className="font-medium text-primary hover:underline"
          >
            Places API
          </Link>{" "}
          and{" "}
          <Link
            href="/docs/competitions-api"
            className="font-medium text-primary hover:underline"
          >
            Competitions API
          </Link>{" "}
          are public, unauthenticated, read-only endpoints. This page is the honest answer
          to &quot;how much can I call this&quot; - what&apos;s actually enforced, not
          what might be assumed.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>No API key, no rate limiting</CardTitle>
            <CardDescription>
              Nothing throttles requests by IP or client today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>
              Neither endpoint requires a key, and neither currently enforces a
              requests-per-minute style limit. What bounds them instead is pagination and
              caching, below. If that ever changes (a key requirement, a 429 response), it
              will show up on the{" "}
              <Link
                href="/docs/changelog"
                className="font-medium text-primary hover:underline"
              >
                changelog
              </Link>{" "}
              and this page gets updated alongside it - don&apos;t build something that
              silently breaks if a limit is added later.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagination caps</CardTitle>
            <CardDescription>
              The real limit is response size, not request rate
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  /api/places
                </code>
                : defaults to {PLACES_API_LIMITS.defaultLimit} rows, hard-capped at{" "}
                {PLACES_API_LIMITS.maxLimit} regardless of what{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  limit
                </code>{" "}
                you pass.
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  /api/competitions
                </code>
                : defaults to {COMPETITIONS_API_LIMITS.defaultLimit} rows, hard-capped at{" "}
                {COMPETITIONS_API_LIMITS.maxLimit}.
              </li>
            </ul>
            <p className="mt-2">
              To pull a full dataset, page through with{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                offset
              </code>{" "}
              at the max limit rather than requesting everything at once.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response caching</CardTitle>
            <CardDescription>
              6 hours - the real reason you rarely need to poll fast
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              Both endpoints set a{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                Cache-Control
              </code>{" "}
              header with a 6-hour max age. The underlying datasets change a few times a
              week at most, so polling more often than that gets you the same data, served
              from cache either way.
            </p>
          </CardContent>
        </Card>
      </div>

      <CalloutCard
        title="Building something that hits these a lot?"
        description="Be a good citizen even without an enforced limit"
        className="mt-4"
      >
        <p>
          Nothing stops a tight polling loop today, but nothing has to reward it either.
          Respect the 6-hour cache window, page through large pulls with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">offset</code>{" "}
          instead of raising{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">limit</code>{" "}
          past what you need, and if you&apos;re running something that calls either
          endpoint thousands of times a day, say so in an issue - that&apos;s exactly the
          kind of usage that would justify adding real rate limiting.
        </p>
      </CalloutCard>
    </>
  );
}
