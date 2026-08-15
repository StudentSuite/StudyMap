import { site } from "@/lib/site";
import type { Place } from "@/lib/types";

/**
 * The schema.org type for a place, choosing a specific subtype where one
 * genuinely fits (a `Library` really is a schema.org Library, etc.) and
 * falling back to the generic `Place` everywhere else.
 */
export function schemaOrgType(type: Place["type"]): string {
  switch (type) {
    case "library":
      return "Library";
    case "gov_offices":
      return "GovernmentOffice";
    case "airport":
      return "Airport";
    default:
      return "Place";
  }
}

/**
 * Build the schema.org/Place JSON-LD graph node for one place.
 *
 * Only fields the dataset actually holds are emitted — never placeholders.
 * `geo` is omitted entirely when coordinates are missing or unusable, and
 * `address` is omitted when the record has none, so the structured data can
 * never misrepresent the page.
 */
export function placeJsonLd(place: Place): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaOrgType(place.type),
    name: place.name,
    // Deep link straight to the place pin on the map.
    url: `${site.url}/map?place=${encodeURIComponent(place.id)}`,
  };

  if (place.address) {
    node.address = place.address;
  }

  const hasLat = typeof place.lat === "number" && Number.isFinite(place.lat);
  const hasLng = typeof place.lng === "number" && Number.isFinite(place.lng);
  if (hasLat && hasLng) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    };
  }

  return node;
}

/**
 * The JSON payload for a `<script type="application/ld+json">` block.
 * `<` is escaped so a name containing `</script>` can never terminate the
 * block early and inject markup.
 */
export function placeJsonLdScript(place: Place): string {
  return JSON.stringify(placeJsonLd(place)).replace(/</g, "\\u003c");
}
