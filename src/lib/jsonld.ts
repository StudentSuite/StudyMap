import { site } from "@/lib/site";
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
 * Only `estimated: false` dates ever reach `startDate`/`endDate` -
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
    eventAttendanceMode: EVENT_ATTENDANCE_MODES[competition.format],
    isAccessibleForFree: competition.fee.amount === 0,
  };

  if (confirmedDates.length > 0) {
    node.startDate = confirmedDates[0];
    node.endDate = confirmedDates[confirmedDates.length - 1];
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
