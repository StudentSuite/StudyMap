import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalloutCard } from "@/components/docs/callout-card";

export const metadata: Metadata = {
  title: "Map Controls",
  description:
    "Every way to zoom, pan, search, and filter the StudyMap map, including keyboard equivalents.",
};

export default function MapControlsPage() {
  return (
    <>
      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zoom</CardTitle>
              <CardDescription>Mouse, touch, and keyboard</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-medium">Scroll wheel:</span> plain scrolling moves
                  the page, not the map (so the map never traps your scroll). Hold{" "}
                  <span className="font-medium">Ctrl</span> (
                  <span className="font-medium">Cmd</span> on Mac) and scroll to zoom -
                  a brief hint appears if you scroll over the map without it held.
                </li>
                <li>
                  <span className="font-medium">+ / - buttons:</span> the zoom control in
                  the map&apos;s corner works with a click or tap, no modifier needed.
                </li>
                <li>
                  <span className="font-medium">Double-click:</span> zooms in one level,
                  centered on the click.
                </li>
                <li>
                  <span className="font-medium">Pinch:</span> on touch devices, pinch to
                  zoom in or out.
                </li>
                <li>
                  <span className="font-medium">Keyboard:</span> click or tab the map to
                  focus it, then press <span className="font-medium">+</span> or{" "}
                  <span className="font-medium">=</span> to zoom in, and{" "}
                  <span className="font-medium">-</span> to zoom out.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pan</CardTitle>
              <CardDescription>Move around the map</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-medium">Drag:</span> click and drag (or swipe on
                  touch) to move the map.
                </li>
                <li>
                  <span className="font-medium">Keyboard:</span> with the map focused, the
                  arrow keys pan up, down, left, and right.
                </li>
                <li>
                  <span className="font-medium">Near me:</span> the locate button flies the
                  map to your current location (with permission).
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clusters</CardTitle>
              <CardDescription>Pie-chart circles group nearby places</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/80">
              <p>
                Where pins are close together, they group into a circle showing a count
                and a color split by place type. Click or tap a cluster to zoom into it;
                it keeps splitting into smaller clusters and eventually individual pins
                as you zoom in.
              </p>
              <p>
                Clicking an individual pin opens a popup with its name, type, and
                Directions / Copy Link actions. Press{" "}
                <span className="font-medium">Escape</span>, or click elsewhere on the
                map, to close it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search &amp; filter</CardTitle>
              <CardDescription>Narrow down what&apos;s shown</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-medium">Search box:</span> matches place name or
                  city as you type.
                </li>
                <li>
                  <span className="font-medium">Category chips:</span> tap one or more to
                  show only those place types; tap again to remove it.
                </li>
                <li>
                  <span className="font-medium">City select:</span> narrows results to one
                  city at a time.
                </li>
                <li>
                  <span className="font-medium">Results list:</span> click a result to fly
                  the map to that pin.
                </li>
                <li>
                  <span className="font-medium">Share:</span> copies a link that reopens
                  the map with your current filters and selection applied.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <CalloutCard
          title="Keyboard &amp; screen-reader support"
          description="Known gaps, being tracked"
          className="mt-4"
        >
          <p>
            Cluster markers don&apos;t yet announce their contents to screen readers, and
            the Ctrl+scroll zoom hint has no keyboard-specific messaging. Both are tracked
            in{" "}
            <a
              href="https://github.com/StudentSuite/StudyMap/issues/99"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              issue #99
            </a>
            . This page will be updated with the keyboard equivalents once that ships.
          </p>
        </CalloutCard>
    </>
  );
}
