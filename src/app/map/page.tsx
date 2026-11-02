import type { Metadata } from "next";

import { getCities, getPlaces } from "@/lib/places";
import { PlacesMap } from "@/components/map/places-map";
import studyMapConfig from "../../../studymap.config";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Interactive map of student-important places worldwide. Filter by type and city, find what is near you, and share the view.",
};

export default function MapPage() {
  const places = getPlaces();

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <PlacesMap
        places={places}
        cities={getCities(places)}
        defaultCenter={studyMapConfig.center}
        defaultZoom={studyMapConfig.defaultZoom}
      />
    </div>
  );
}
