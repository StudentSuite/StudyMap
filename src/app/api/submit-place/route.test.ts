import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createIssue, queueFull } = vi.hoisted(() => ({
  createIssue: vi.fn(),
  queueFull: vi.fn(),
}));

vi.mock("@/lib/submit-place", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/submit-place")>();
  return { ...actual, createSubmissionIssue: createIssue, isQueueFull: queueFull };
});

import { POST } from "./route";

const good = {
  name: "Central Library",
  type: "library",
  city: "Mumbai",
  gmapsLink: "https://maps.google.com/?q=19.0176,72.8562",
  contributor: "",
  note: "",
};

let ip = 0;
function post(body: unknown, headers: Record<string, string> = {}) {
  ip += 1;
  return POST(
    new Request("http://localhost/api/submit-place", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `10.0.0.${ip}`,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  process.env.PLACE_SUBMISSION_TOKEN = "test-token";
  createIssue.mockReset().mockResolvedValue("https://github.com/o/r/issues/1");
  queueFull.mockReset().mockResolvedValue(false);
});

afterEach(() => {
  delete process.env.PLACE_SUBMISSION_TOKEN;
});

describe("POST /api/submit-place", () => {
  it("files an issue and returns its URL", async () => {
    const res = await post(good);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      ok: true,
      issueUrl: "https://github.com/o/r/issues/1",
    });
    expect(createIssue).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ name: "Central Library", city: "mumbai" }),
    );
  });

  it("returns 400 for bad JSON and for an invalid submission", async () => {
    expect((await post("{nope")).status).toBe(400);
    const res = await post({ ...good, gmapsLink: "https://evil.example" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, reason: "invalid" });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("returns 413 for an oversized body", async () => {
    const res = await post({ ...good, note: "x".repeat(6000) });
    expect(res.status).toBe(413);
  });

  it("silently succeeds on a filled honeypot without filing anything", async () => {
    const res = await post({ ...good, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("files a real website sent as placeWebsite, which is not the honeypot (#356)", async () => {
    const res = await post({
      ...good,
      placeWebsite: "https://www.bl.uk/",
      phone: "+44 20 7412 7000",
      hours: "Mon-Fri 09:30-20:00",
      website: "",
    });
    expect(res.status).toBe(201);
    expect(createIssue).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({
        website: "https://www.bl.uk/",
        phone: "+442074127000",
        hours: "Mon-Fri 09:30-20:00",
      }),
    );
  });

  it("rejects a malformed phone with a message instead of dropping it (#356)", async () => {
    const res = await post({ ...good, phone: "020 7412 7000" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, reason: "invalid" });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("returns 503 unavailable when no token is configured", async () => {
    delete process.env.PLACE_SUBMISSION_TOKEN;
    const res = await post(good);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: "unavailable" });
  });

  it("returns 503 full when the pending queue is at the cap", async () => {
    queueFull.mockResolvedValue(true);
    const res = await post(good);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: "full" });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("returns 502 when GitHub refuses the issue", async () => {
    createIssue.mockResolvedValue(null);
    const res = await post(good);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, reason: "github" });
  });

  it("rate limits one address after five submissions", async () => {
    const headers = { "x-forwarded-for": "203.0.113.9" };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await POST(
        new Request("http://localhost/api/submit-place", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(good),
        }),
      );
      statuses.push(res.status);
    }
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
  });
});
