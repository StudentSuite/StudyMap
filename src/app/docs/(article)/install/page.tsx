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
  title: "Install & Offline Usage",
  description:
    "Install StudyMap as an app and use it offline: what's cached, how the service worker works, and how to force a fresh load.",
};

export default function InstallPage() {
  return (
    <>
      <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add to Home Screen</CardTitle>
              <CardDescription>Uses your browser&apos;s built-in install feature, no app store</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <span className="font-medium">Android (Chrome):</span> tap the ⋮ menu
                  and choose <span className="font-medium">Install app</span> (or{" "}
                  <span className="font-medium">Add to Home screen</span>), or tap the
                  install icon in the address bar if it appears.
                </li>
                <li>
                  <span className="font-medium">iPhone/iPad (Safari):</span> tap the{" "}
                  <span className="font-medium">Share</span> button, then{" "}
                  <span className="font-medium">Add to Home Screen</span>.
                </li>
                <li>
                  <span className="font-medium">Desktop (Chrome/Edge):</span> click the
                  install icon in the address bar, or open the browser menu and choose{" "}
                  <span className="font-medium">Install StudyMap...</span>.
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                StudyMap doesn&apos;t show its own install button - this is entirely your
                browser&apos;s native feature, driven by the app&apos;s manifest and
                service worker.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What works offline</CardTitle>
              <CardDescription>Whatever you&apos;ve already opened, plus the map itself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/80">
              <ul className="ml-4 list-disc space-y-2">
                <li>The app shell (home, map, and other pages you&apos;ve visited before).</li>
                <li>
                  Map tiles you&apos;ve already panned/zoomed to - cached as you browse, up
                  to 300 tiles, so the whole world isn&apos;t hoarded on your device.
                </li>
                <li>
                  Any page you haven&apos;t visited yet falls back to an{" "}
                  <span className="font-medium">Offline</span> screen instead of a browser
                  error.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Signing in, saving a new place, or loading a city you&apos;ve never opened
                still needs a connection - only what&apos;s already cached works fully
                offline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How the caching works</CardTitle>
              <CardDescription>A versioned service worker (public/sw.js)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/80">
              <p>
                Two caches, each tagged with a version: an app cache (page shell, build
                assets, icons) and a tile cache (map tiles from MapTiler). Page loads try
                the network first and fall back to the cache when offline; static assets
                and tiles are cache-first since they don&apos;t change under the same URL.
              </p>
              <p>
                Every deploy bumps the version, which deletes old caches once the new
                service worker activates - normally a reload is enough to pick up a new
                release.
              </p>
            </CardContent>
          </Card>
        </div>

        <CalloutCard
          title="App looks out of date after a deploy?"
          description="Usually a stale service worker, not a failed deploy"
          className="mt-4"
        >
          <p>Try these in order:</p>
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>
              <span className="font-medium">Hard refresh:</span> Cmd+Shift+R on Mac,
              Ctrl+Shift+R or Ctrl+F5 on Windows/Linux.
            </li>
            <li>
              <span className="font-medium">Clear site data:</span> in your browser&apos;s
              dev tools (Application tab in Chrome/Edge, Storage in Firefox), clear
              Service Workers, Cache Storage, and Storage for the site, then reload.
            </li>
            <li>
              <span className="font-medium">Reinstall the PWA:</span> if you installed it
              to your home screen, remove it and reinstall from the site.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            If none of these help, the deploy itself likely hasn&apos;t shipped yet - check
            the deployment status before assuming it&apos;s a caching issue.
          </p>
        </CalloutCard>
    </>
  );
}
