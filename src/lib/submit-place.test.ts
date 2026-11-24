import { describe, expect, it, vi } from "vitest";

import {
  PENDING_CAP,
  createRateLimiter,
  createSubmissionIssue,
  isQueueFull,
} from "@/lib/submit-place";

describe("createRateLimiter", () => {
  it("allows up to max per window, then blocks, then resets", () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(false);
    expect(allow("b")).toBe(true);
    t = 1001;
    expect(allow("a")).toBe(true);
  });
});

function json(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe("isQueueFull", () => {
  it("is true at the cap and false below it", async () => {
    const full = vi.fn().mockResolvedValue(json(new Array(PENDING_CAP).fill({})));
    const some = vi.fn().mockResolvedValue(json([{}, {}]));
    expect(await isQueueFull("t", full)).toBe(true);
    expect(await isQueueFull("t", some)).toBe(false);
  });

  it("fails open when the API errors or throws", async () => {
    expect(await isQueueFull("t", vi.fn().mockResolvedValue(json({}, false, 500)))).toBe(
      false,
    );
    expect(await isQueueFull("t", vi.fn().mockRejectedValue(new Error("down")))).toBe(
      false,
    );
  });
});

describe("createSubmissionIssue", () => {
  const sub = {
    name: "Central Library",
    type: "library",
    city: "mumbai",
    gmapsLink: "https://maps.google.com/?q=19.0176,72.8562",
    contributor: "",
    note: "",
  };

  it("posts a labelled issue with the machine-readable body and returns its URL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(json({ html_url: "https://github.com/o/r/issues/7" }));
    expect(await createSubmissionIssue("tok", sub, fetchImpl)).toBe(
      "https://github.com/o/r/issues/7",
    );

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/StudentSuite/StudyMap/issues");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const sent = JSON.parse(init.body as string);
    expect(sent.labels).toContain("place-submission");
    expect(sent.body).toContain("studymap-place-submission:v1");
  });

  it("returns null on a GitHub error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(json({}, false, 403));
    expect(await createSubmissionIssue("tok", sub, fetchImpl)).toBeNull();
  });
});
