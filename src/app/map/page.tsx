import type { Metadata } from "next";

import { getPlaces } from "@/lib/places";
import { PlacesMap } from "@/components/map/places-map";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Interactive map of student-important places worldwide. Filter by type and city, find what is near you, and share the view.",
};

export default function MapPage() {
  const places = getPlaces();

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <PlacesMap places={places} />
    </div>
  );
}
