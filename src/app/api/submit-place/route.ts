import { NextResponse } from "next/server";

import { normalizeSubmission } from "../../../../scripts/lib/place-submission.mjs";

import {
  createRateLimiter,
  createSubmissionIssue,
  isQueueFull,
} from "@/lib/submit-place";

// Every call must reach the live rate limiter and GitHub, never a cached response.
export const dynamic = "force-dynamic";

const allow = createRateLimiter();
const MAX_BODY_BYTES = 4096;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  );
}

/**
 * Account-less place submission (#264). Validates the form, then files a
 * labelled GitHub issue with the server-side token; a workflow turns that
 * issue into a pull request a maintainer reviews.
 *
 * `reason` tells the form what to do on failure: "unavailable" and "github"
 * make it fall back to the prefilled-issue path, the rest show a message.
 */
export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  // Honeypot: a real person never fills the hidden field. Report success so a
  // bot learns nothing, and file nothing.
  const honeypot =
    typeof body === "object" && body !== null
      ? (body as { website?: unknown }).website
      : undefined;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = normalizeSubmission(body);
  if (!parsed.ok || !parsed.value) {
    return NextResponse.json(
      { ok: false, reason: "invalid", error: parsed.error },
      { status: 400 },
    );
  }

  const token = process.env.PLACE_SUBMISSION_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  if (!allow(clientKey(request))) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  if (await isQueueFull(token)) {
    return NextResponse.json({ ok: false, reason: "full" }, { status: 503 });
  }

  const issueUrl = await createSubmissionIssue(token, parsed.value);
  if (!issueUrl) {
    return NextResponse.json({ ok: false, reason: "github" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, issueUrl }, { status: 201 });
}
