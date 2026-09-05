import { NextResponse } from "next/server";

import { parseCompetitionsQuery, queryCompetitions } from "@/lib/competitions-api";
import { getCompetitions } from "@/lib/competitions";

/**
 * The dataset changes a few times a week at most (same cadence as places,
 * issue #123), so a 6-hour ISR window plus a stale-while-revalidate header
 * keeps responses cached without ever serving stale data for long.
 */
export const revalidate = 21600;

/** Every origin may read the dataset — that is the entire point of the API. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseCompetitionsQuery(url.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: { ...CORS_HEADERS, ...CACHE_HEADERS } },
    );
  }

  const result = queryCompetitions(getCompetitions(), parsed.query);
  return NextResponse.json(result, {
    headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
  });
}
