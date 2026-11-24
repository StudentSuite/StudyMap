/**
 * Pulls a lat/lng pair out of a Google Maps URL. Handles the shapes a person
 * gets from "Share" or from copying the address bar:
 *
 *   .../place/Name/@19.0176,72.8562,17z/data=...
 *   .../place/Name/data=!3d19.0176!4d72.8562
 *   https://maps.google.com/?q=19.0176,72.8562
 *   https://www.google.com/maps?ll=19.0176,72.8562
 *   https://www.google.com/maps/search/?api=1&query=19.0176,72.8562
 *
 * The pin location (!3d / !4d) wins over the viewport centre (@lat,lng),
 * because the centre is wherever the map was scrolled to.
 *
 * Short links (maps.app.goo.gl, goo.gl/maps) carry no coordinates; resolve
 * them with `resolveShortLink` first.
 *
 * Returns { lat, lng } or null.
 */

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";
const PIN_RE = new RegExp(`!3d${NUM}!4d${NUM}`);
const AT_RE = new RegExp(`@${NUM},${NUM}`);
const PARAM_RE = new RegExp(
  `[?&](?:q|query|ll|center|destination)=${NUM}(?:,|%2C)${NUM}(?:&|$)`,
  "i",
);

function inRange(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function coordinatesFromGoogleMapsUrl(url) {
  if (typeof url !== "string") return null;
  let text = url.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // keep the raw text
  }
  for (const re of [PIN_RE, AT_RE, PARAM_RE]) {
    const match = re.exec(text);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (inRange(lat, lng)) return { lat, lng };
  }
  return null;
}

export function isShortGoogleMapsLink(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname === "maps.app.goo.gl") return parsed.pathname.length > 1;
    return parsed.hostname === "goo.gl" && parsed.pathname.startsWith("/maps/");
  } catch {
    return false;
  }
}

/**
 * Follows a short link's redirects (up to 5 hops, only through Google hosts)
 * and returns the final URL, or null. Only ever fetches hosts on the
 * allowlist, so a submitted link cannot point the runner at another server.
 */
export async function resolveShortLink(url, fetchImpl = fetch) {
  const allowed = new Set([
    "maps.app.goo.gl",
    "goo.gl",
    "www.google.com",
    "google.com",
    "maps.google.com",
  ]);
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    let parsed;
    try {
      parsed = new URL(current);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:" || !allowed.has(parsed.hostname)) return null;
    if (coordinatesFromGoogleMapsUrl(current)) return current;
    const res = await fetchImpl(current, { redirect: "manual" });
    const location = res.headers.get("location");
    if (!location) return current;
    current = new URL(location, current).toString();
  }
  return null;
}
