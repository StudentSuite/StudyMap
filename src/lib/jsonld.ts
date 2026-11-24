import { site } from "@/lib/site";
import type { CountryPage } from "@/lib/country-pages";
import { humanizeCity } from "@/lib/types";
import type { Competition, CompetitionFormat } from "@/lib/types";
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

const EVENT_ATTENDANCE_MODES: Record<CompetitionFormat, string> = {
  online: "https://schema.org/OnlineEventAttendanceMode",
  in_person: "https://schema.org/OfflineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

/**
 * schema.org/Event for most competitions; schema.org/EducationalOccupationalProgram
 * for the `scholarship` category, since a scholarship judged on a body of
 * work is a program a student applies to, not a single dated event.
 */
export function schemaOrgCompetitionType(category: Competition["category"]): string {
  return category === "scholarship" ? "EducationalOccupationalProgram" : "Event";
}

/**
 * Build the schema.org JSON-LD graph node for one competition.
 *
 * Event-only properties (`eventAttendanceMode`, `startDate`, `endDate`) are
 * written only when the node is an `Event`. Only `estimated: false` dates
 * ever reach `startDate`/`endDate` -
 * publishing an estimated date as structured data would invite a search
 * engine to present a guess as a fact. When every date on the record is
 * still estimated, `startDate`/`endDate` are omitted entirely rather than
 * emitting a guess.
 */
export function competitionJsonLd(competition: Competition): Record<string, unknown> {
  const confirmedDates = competition.dates
    .filter((date) => !date.estimated)
    .map((date) => date.date)
    .sort();

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaOrgCompetitionType(competition.category),
    name: competition.name,
    description: competition.description,
    // The StudyMap detail page, not the organizer's own site - matches
    // placeJsonLd's convention of linking back to StudyMap's own page.
    url: `${site.url}/competitions/${competition.id}`,
    organizer: {
      "@type": "Organization",
      name: competition.organizer,
      url: competition.organizer_url,
    },
    isAccessibleForFree: competition.fee.amount === 0,
  };

  // eventAttendanceMode, startDate and endDate are schema.org Event properties.
  // An EducationalOccupationalProgram (a scholarship) doesn't have them, so
  // putting them on it is a type mismatch that structured-data validators flag.
  if (node["@type"] === "Event") {
    node.eventAttendanceMode = EVENT_ATTENDANCE_MODES[competition.format];
    if (confirmedDates.length > 0) {
      node.startDate = confirmedDates[0];
      node.endDate = confirmedDates[confirmedDates.length - 1];
    }
  }

  return node;
}

/**
 * The JSON payload for a `<script type="application/ld+json">` block.
 * `<` is escaped so a name or description containing `</script>` can never
 * terminate the block early and inject markup.
 */
export function competitionJsonLdScript(competition: Competition): string {
  return JSON.stringify(competitionJsonLd(competition)).replace(/</g, "\\u003c");
}

/**
 * schema.org markup for a country landing page (#358): a `Country` that
 * contains its cities, plus an `ItemList` of those cities so a crawler can
 * follow them to their own pages. Names and counts are real; nothing is
 * invented.
 */
export function countryJsonLd(page: CountryPage): Record<string, unknown> {
  const url = `${site.url}/country/${page.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Country",
        "@id": `${url}#country`,
        name: page.name,
        identifier: page.code,
        url,
      },
      {
        "@type": "ItemList",
        "@id": `${url}#cities`,
        name: `Cities in ${page.name} on StudyMap`,
        numberOfItems: page.cities.length,
        itemListElement: page.cities.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: humanizeCity(entry.city),
          url: `${site.url}/city/${entry.slug}`,
        })),
      },
    ],
  };
}

/** The JSON payload for a country page's `<script type="application/ld+json">` block, with `<` escaped. */
export function countryJsonLdScript(page: CountryPage): string {
  return JSON.stringify(countryJsonLd(page)).replace(/</g, "\\u003c");
}
