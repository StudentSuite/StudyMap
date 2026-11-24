import { SUBMISSION_LABEL, buildIssueBody } from "../../scripts/lib/place-submission.mjs";

import { site } from "@/lib/site";

/** Open `place-submission` issues allowed at once. Past this the form says "try later". */
export const PENDING_CAP = 60;
/** Submissions allowed per address per window. */
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export interface PlaceSubmission {
  name: string;
  type: string;
  city: string;
  gmapsLink: string;
  contributor: string;
  note: string;
}

/**
 * Fixed-window counter per key, held in memory. On serverless each instance
 * has its own counter, so this is a speed bump against one client hammering
 * the form, not a hard guarantee; the pending cap and maintainer review are
 * the real limits.
 */
export function createRateLimiter(
  max = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
  now: () => number = Date.now,
) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string): boolean {
    const t = now();
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  };
}

function repoSlug(): string {
  return new URL(site.repo).pathname.replace(/^\/|\/$/g, "");
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** True when the queue of unreviewed submissions is at the cap. Fails open on API errors. */
export async function isQueueFull(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(
      `https://api.github.com/repos/${repoSlug()}/issues?labels=${SUBMISSION_LABEL}&state=open&per_page=100`,
      { headers: githubHeaders(token), cache: "no-store" },
    );
    if (!res.ok) return false;
    const issues = (await res.json()) as unknown[];
    return Array.isArray(issues) && issues.length >= PENDING_CAP;
  } catch {
    return false;
  }
}

/** Creates the labelled issue the workflow picks up. Returns its URL, or null on failure. */
export async function createSubmissionIssue(
  token: string,
  submission: PlaceSubmission,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const res = await fetchImpl(`https://api.github.com/repos/${repoSlug()}/issues`, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({
      title: `Place submission: ${submission.name}`,
      body: buildIssueBody(submission),
      labels: [SUBMISSION_LABEL, "data"],
    }),
  });
  if (!res.ok) {
    console.error(`submit-place: GitHub returned ${res.status}`);
    return null;
  }
  const json = (await res.json()) as { html_url?: unknown };
  return typeof json.html_url === "string" ? json.html_url : null;
}
