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
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Embedding the Map",
  description:
    "Drop a live StudyMap view on your own site with an <iframe>: get the code from the map's Embed button, or build the URL yourself.",
};

const SNIPPET = `<iframe
  src="${site.url}/embed?city=mumbai&types=library"
  width="100%"
  height="480"
  style="border: 1px solid #e5e5e5; border-radius: 12px;"
  loading="lazy"
  title="${site.name}"
></iframe>`;

export default function EmbeddingWidgetPage() {
  return (
    <>
      <div className="space-y-4">
        <p className="text-foreground/80">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/embed</code> is a
          second, chrome-free version of the map: no navbar, no sidebar, no sign-in - just
          the pins, sized to fit wherever you put it. It&apos;s meant to be put inside an{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            &lt;iframe&gt;
          </code>{" "}
          on a school, library, or organization&apos;s own site.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Get the code from the map</CardTitle>
            <CardDescription>Easiest path - no URL-building required</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              On{" "}
              <Link href="/map" className="font-medium text-primary hover:underline">
                /map
              </Link>
              , set up whatever filters, city, or zoomed-in view you want (the same way
              you would before clicking <span className="font-medium">Share</span>), then
              click <span className="font-medium">Embed</span> next to it. The dialog
              gives you a ready-to-paste{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                &lt;iframe&gt;
              </code>{" "}
              snippet for exactly that view.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Or build the URL yourself</CardTitle>
            <CardDescription>
              Same query parameters as a shared /map link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  city
                </code>
                : a city slug (e.g. <code className="font-mono text-xs">mumbai</code>)
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  types
                </code>
                : comma-separated place types (e.g.{" "}
                <code className="font-mono text-xs">library,sat_centre</code>)
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  lat
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  lng
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  zoom
                </code>
                : a specific starting viewport instead of fitting all visible places
              </li>
            </ul>
            <CodeBlock code={SNIPPET} lang="html" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What it doesn&apos;t include</CardTitle>
            <CardDescription>Public data only, by design</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            <p>
              The embed has no sign-in and shows no account-specific state - never saved
              places, never a home location, never anything tied to whoever&apos;s
              visiting your site. It&apos;s the same public dataset the rest of{" "}
              {site.name} reads from, nothing more.
            </p>
          </CardContent>
        </Card>
      </div>

      <CalloutCard
        title="Sizing it"
        description="Width is fluid; height is up to you"
        className="mt-4"
      >
        <p>
          The iframe fills whatever width its container gives it. Height is a fixed pixel
          value you set (480px in the snippet above) - there&apos;s no auto-resize, so
          pick something tall enough that the map and its small attribution bar at the
          bottom both have room.
        </p>
      </CalloutCard>
    </>
  );
}
