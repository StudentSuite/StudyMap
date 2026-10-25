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

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Where StudyMap is headed: what just shipped, what's thin and needs contributions, and how direction actually gets decided here.",
};

export default function RoadmapPage() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-foreground/80">
          StudyMap doesn&apos;t run on a fixed release calendar - it&apos;s a
          community-maintained, open-source project, so direction follows what
          contributors actually bring. This page is a snapshot of where things stand, not
          a promise of dates.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Recently shipped</CardTitle>
            <CardDescription>
              See the full{" "}
              <Link
                href="/docs/changelog"
                className="font-medium text-primary hover:underline"
              >
                changelog
              </Link>{" "}
              for everything
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                A full competitions catalog alongside the places map: browse, filter,
                save, a per-competition calendar feed, and a public API.
              </li>
              <li>
                The verification system - places and competitions can carry a{" "}
                <Link
                  href="/docs/verification-process"
                  className="font-medium text-primary hover:underline"
                >
                  Verified badge
                </Link>{" "}
                that expires on its own instead of going stale silently.
              </li>
              <li>
                City landing pages, site-wide search, and onboarding for new accounts.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s thin right now</CardTitle>
            <CardDescription>The honest gaps, not a sales pitch</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <span className="font-medium">Geographic depth.</span> Coverage is
                deepest in India and a handful of other countries; most of the world has
                at most a handful of entries per category, if any. Adding a real,
                verifiable place in an under-covered city is one of the highest-value
                single contributions anyone can make.
              </li>
              <li>
                <span className="font-medium">Re-verification.</span> Most places have
                never been verified at all - the badge is new enough that the backlog of
                places worth checking is large. See{" "}
                <Link
                  href="/docs/verification-process"
                  className="font-medium text-primary hover:underline"
                >
                  Verification &amp; the Verified Badge
                </Link>
                .
              </li>
              <li>
                <span className="font-medium">Category balance.</span> Some categories
                (SAT centres, exam centres) have far deeper coverage than others
                (government offices, other places) in most regions.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How direction actually gets decided</CardTitle>
            <CardDescription>Issues and pull requests, not a backlog tool</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              There&apos;s no separate planning document contributors need to read before
              opening an issue. If something&apos;s missing, broken, or worth building,{" "}
              <a
                href="https://github.com/StudentSuite/StudyMap/issues"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                open an issue
              </a>
              . What actually ships is whatever gets a pull request, weighted toward
              things that make the dataset more accurate or cover more students, over
              features for their own sake.
            </p>
          </CardContent>
        </Card>
      </div>

      <CalloutCard
        title="Want to help move one of these?"
        description="Adding a place or verifying one is the fastest path to real impact"
        className="mt-4"
      >
        <p>
          Start at{" "}
          <Link
            href="/docs/contributing"
            className="font-medium text-primary hover:underline"
          >
            Contributing Places
          </Link>
          . No account or local setup is required for either adding or verifying a place -
          both go through a GitHub issue form.
        </p>
      </CalloutCard>
    </>
  );
}
