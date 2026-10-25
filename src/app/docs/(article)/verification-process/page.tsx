import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StepCard } from "@/components/docs/step-card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Verification & the Verified Badge",
  description:
    "How a place earns the Verified badge, how long it stays current (12 months, 6 for exam centres), and how to re-check a stale one.",
};

export default function VerificationProcessPage() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-foreground/80">
          Every place on the map starts unverified - it exists because a contributor
          sourced it, not because anyone has physically confirmed it recently. The{" "}
          <span className="font-medium">Verified</span> badge is StudyMap&apos;s way of
          surfacing which listings someone has actually re-checked, and how recently.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>What the badge means</CardTitle>
            <CardDescription>A green badge with the check date, next to the pin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>
              A place shows the badge only while its verification is inside the expiry
              window:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <span className="font-medium">12 months</span> for libraries, airports,
                government offices, and other places.
              </li>
              <li>
                <span className="font-medium">6 months</span> for SAT centres and foreign
                language exam centres - these change more often (centres open, close, or
                stop offering an exam between sessions).
              </li>
            </ul>
            <p>
              Once a verification is older than its window, the badge disappears on its
              own - nobody has to remember to remove it. The place stays on the map either
              way; it just reads as unverified until someone checks it again.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 space-y-0">
        <StepCard
          step={1}
          title="Pick a stale or unverified place"
          description="Oldest or never-verified is most valuable"
        >
          <p>
            Any place without a current badge is fair game. A place that has never been
            verified, or one whose badge is close to expiring, is more useful to check
            than one that was just verified last week.
          </p>
        </StepCard>

        <StepCard
          step={2}
          title="Check it against Google Maps (or in person)"
          description="Address, entrance, and open status"
        >
          <p>
            Confirm the address and entrance still match what&apos;s on the map, and that
            the place is still open and operating. If anything has actually changed - name,
            address, permanently closed - that&apos;s a correction, not a verification;
            say so in the issue instead of confirming stale data.
          </p>
        </StepCard>

        <StepCard
          step={3}
          title="File a &quot;Verify a place&quot; issue"
          description="One small form, no pull request needed"
          isLast
        >
          <p>
            Open a{" "}
            <a
              href="https://github.com/StudentSuite/StudyMap/issues/new?template=verify-place.yml"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Verify a place
            </a>{" "}
            issue with the place&apos;s id (from its dataset entry, or the map&apos;s share
            link), the date you checked it, and what you found. A maintainer then adds the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              verified
            </code>{" "}
            block to the record and the badge appears.
          </p>
        </StepCard>
      </div>

      <CalloutCard
        title="Found something wrong, not just stale?"
        description="That's a correction, handled differently from a re-verification"
        className="mt-4"
      >
        <p>
          If the place has moved, closed, or the listing is just wrong, open a regular
          issue describing the correction (or a pull request editing the record directly)
          instead of a verification - see{" "}
          <Link
            href="/docs/contributing"
            className="font-medium text-primary hover:underline"
          >
            Contributing Places
          </Link>
          . Verifying is for confirming a listing is still accurate, not fixing one that
          isn&apos;t.
        </p>
      </CalloutCard>
    </>
  );
}
