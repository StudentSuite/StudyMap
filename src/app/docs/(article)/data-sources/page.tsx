import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Data Sources & Provenance",
  description:
    "Where StudyMap's place and exam-centre data comes from, how it's verified, licensing, and known accuracy caveats.",
};

export default function DataSourcesPage() {
  return (
    <>
      <p className="mb-6 text-foreground/80">
        Where the map&apos;s data comes from and how it&apos;s verified. For the legal
        side (liability, use-at-your-own-risk), see the{" "}
        <Link
          href="/legal/disclaimer"
          className="font-medium text-primary hover:underline"
        >
          Disclaimer
        </Link>{" "}
        page instead - this one is about provenance, not privacy or liability.
      </p>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>How places get added</CardTitle>
            <CardDescription>Community-sourced, via GitHub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              Every place in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/</code> was
              added by a contributor through a GitHub issue or pull request, not by
              StudyMap staff independently researching locations. Each record carries an{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">added_by</code>{" "}
              field crediting the GitHub username that submitted it.
            </p>
            <p>
              Contributors are asked to include, in the pull request itself (never in the
              committed data): a source or citation, a Google Maps rating of 4.0 or
              higher, 50 or more Google Maps reviews, and the date they verified the
              place. See{" "}
              <Link
                href="/docs/contributing"
                className="font-medium text-primary hover:underline"
              >
                Contributing Places
              </Link>{" "}
              for the full process.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk-imported SAT centres</CardTitle>
            <CardDescription>A different path from hand-added places</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>
              A large share of{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                sat_centre.json
              </code>{" "}
              came from a bulk import rather than individual contributor submissions -
              identifiable by numeric, CEEB-style{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">id</code> values
              instead of the usual{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                city-type-number
              </code>{" "}
              format. These entries did not go through the same per-place rating/review
              gate as hand-added places.
            </p>
            <p className="text-xs text-muted-foreground">
              Coordinates on these entries are accurate, but a few had formatting quirks
              from the import (inconsistent city casing, a placeholder-style{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">gmaps_link</code>{" "}
              on some records) that have been progressively cleaned up. None of this
              affects in-app navigation, since Directions is always computed live from the
              stored coordinates, never from the stored link.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification is honor-system, not automated</CardTitle>
            <CardDescription>What the validator actually checks</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                scripts/validate-places.mjs
              </code>{" "}
              (run on every pull request) checks structure - required fields, valid types,
              coordinate bounds, unique IDs, well-formed links. It cannot verify that a
              place is real, still open, or actually has the rating and review count
              claimed in the PR description. That part relies on reviewer judgment and
              contributor honesty.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exam calendar dates</CardTitle>
            <CardDescription>Sourced from the official boards</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              SAT, IB, and Cambridge IGCSE session and result dates are sourced directly
              from College Board, IBO, and Cambridge International, with a link back to
              the source on every entry. See{" "}
              <Link
                href="/docs/calendar"
                className="font-medium text-primary hover:underline"
              >
                Using the Exam Calendar
              </Link>{" "}
              for how provisional dates are marked.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licensing</CardTitle>
            <CardDescription>MIT, code and data alike</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              The entire repository, including everything in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">data/</code>, is
              MIT licensed. See{" "}
              <a
                href={`${site.repo}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                LICENSE
              </a>{" "}
              on GitHub.
            </p>
          </CardContent>
        </Card>
      </div>

      <CalloutCard
        title="Found inaccurate or stale data?"
        description="Places move, close, and change - help us catch it"
        className="mt-4"
      >
        <p>
          Open an issue at{" "}
          <a
            href={`${site.repo}/issues`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            github.com/StudentSuite/StudyMap/issues
          </a>{" "}
          with what changed. See the{" "}
          <Link
            href="/legal/disclaimer"
            className="font-medium text-primary hover:underline"
          >
            Disclaimer
          </Link>{" "}
          for why you should always verify details before visiting.
        </p>
      </CalloutCard>
    </>
  );
}
