import type { Metadata } from "next";

import { getPlaces } from "@/lib/places";
import { EmbedMap } from "@/components/map/embed-map";
import studyMapConfig from "../../../studymap.config";

export const metadata: Metadata = {
  title: "Embedded Map",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  const places = getPlaces();

  return (
    <div className="h-dvh w-full">
      <EmbedMap
        places={places}
        defaultCenter={studyMapConfig.center}
        defaultZoom={studyMapConfig.defaultZoom}
      />
    </div>
  );
}
