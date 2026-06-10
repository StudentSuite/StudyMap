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
      <Button asChild className="mt-6">
        <Link href="/">Back to the map</Link>
      </Button>
    </div>
  );
}
