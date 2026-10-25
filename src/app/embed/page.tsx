import type { Metadata } from "next";

import { getPlaces } from "@/lib/places";
import { EmbedMap } from "@/components/map/embed-map";

export const metadata: Metadata = {
  title: "Embedded Map",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  const places = getPlaces();

  return (
    <div className="h-dvh w-full">
      <EmbedMap places={places} />
    </div>
  );
}
