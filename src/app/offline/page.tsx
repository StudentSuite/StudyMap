import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
        You are offline
      </h1>
      <p className="mt-2 text-muted-foreground">
        Pages you have already opened still work offline, including the map. This
        page just means the one you asked for has not been cached yet.
      </p>
      <div className="mt-6 grid w-full gap-3 rounded-lg border border-border bg-card p-4 text-left text-sm">
        <div>
          <h2 className="font-semibold text-foreground">Available offline</h2>
          <p className="mt-1 text-muted-foreground">
            Previously opened pages and cached map data may still be available.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Needs a connection</h2>
          <p className="mt-1 text-muted-foreground">
            Uncached pages, fresh map tiles, sign-in, and live updates need the
            network.
          </p>
        </div>
      </div>
      <Button asChild className="mt-6">
        <Link href="/">Back to the map</Link>
      </Button>
    </div>
  );
}
