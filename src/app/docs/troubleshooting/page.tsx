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
  title: "Troubleshooting",
  description:
    "Common problems when running StudyMap locally or on a fork, and what actually causes them.",
};

export default function TroubleshootingPage() {
  return (
    <>
      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Map doesn&apos;t load, or the basemap is blank/grey</CardTitle>
              <CardDescription>Almost always a missing or invalid MapTiler key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/80">
              <p>
                The map tiles come from MapTiler, and unlike the Supabase variables, this
                one is required - the basemap will not render without it.
              </p>
              <p>
                Get a free key at{" "}
                <a
                  href="https://cloud.maptiler.com/account/keys/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  cloud.maptiler.com
                </a>
                , add it to <code className="rounded bg-muted px-1.5 py-0.5 font-mono">.env.local</code> as{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">NEXT_PUBLIC_MAPTILER_KEY</code>,
                and restart the dev server - env vars are only read on boot.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signed in, but saved places or the calendar show an error</CardTitle>
              <CardDescription>The Supabase tables for the app&apos;s own data aren&apos;t set up yet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/80">
              <p>
                This means the Supabase tables exist for auth but not for the app&apos;s own
                data (saved places, home location, personal calendar events). Code already
                catches this: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">isMissingTableError()</code>{" "}
                checks for Postgres error <code className="rounded bg-muted px-1.5 py-0.5 font-mono">PGRST205</code>{" "}
                (&quot;table not found in schema cache&quot;) and shows a message pointing here
                instead of a generic failure.
              </p>
              <p>
                Fix: in the Supabase SQL editor, run every file in{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">supabase/migrations/</code>, in
                filename order. See{" "}
                <a
                  href={`${site.repo}/blob/main/SELF-HOSTING.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  SELF-HOSTING.md
                </a>{" "}
                for the full self-host setup.
              </p>
              <p className="text-xs text-muted-foreground">
                If you don&apos;t need auth at all, leave the Supabase env vars blank. The map,
                search, filters, and calendar all work without them - you just lose sign-in,
                saved places, and personal events.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>&quot;Near me&quot; doesn&apos;t work</CardTitle>
              <CardDescription>Geolocation issues, and why the pin sometimes looks off</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-medium">No prompt appeared, or it&apos;s silently doing
                  nothing:</span> the browser doesn&apos;t support the Geolocation API, or the
                  page isn&apos;t served over HTTPS (required by most browsers outside{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono">localhost</code>).
                </li>
                <li>
                  <span className="font-medium">&quot;Could not read your location&quot;:</span>{" "}
                  location permission was denied, or the device couldn&apos;t get a fix. Check
                  the browser&apos;s site permissions and try again.
                </li>
                <li>
                  <span className="font-medium">Location seems wrong:</span> some browsers fall
                  back to IP-based location when GPS/Wi-Fi positioning is unavailable, which
                  can be off by kilometers, especially on desktop.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>The app looks out of date after a deploy</CardTitle>
              <CardDescription>Usually a PWA caching issue</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <p>
                See{" "}
                <Link href="/docs/install" className="font-medium text-primary hover:underline">
                  Install &amp; Offline Usage
                </Link>{" "}
                for what gets cached and how to force a fresh load.
              </p>
            </CardContent>
          </Card>
        </div>

        <CalloutCard title="Still stuck" description="We're happy to help" className="mt-4">
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
            or email{" "}
            <a
              href="mailto:studentsuite3@gmail.com"
              className="font-medium text-primary hover:underline"
            >
              studentsuite3@gmail.com
            </a>
            .
          </p>
        </CalloutCard>
    </>
  );
}
