import { getPlaces } from "@/lib/places";
import { PlacesMap } from "@/components/map/places-map";

export default function HomePage() {
  const places = getPlaces();

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <PlacesMap places={places} />
    </div>
  );
}
