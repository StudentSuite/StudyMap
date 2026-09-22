import { describe, expect, it, vi } from "vitest";

let mockAllow: (email: string) => Promise<boolean>;
vi.mock("@/lib/password-reset-rate-limit", () => ({
  allowPasswordResetAttempt: (email: string) => mockAllow(email),
}));

import { POST } from "./route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password (route handler)", () => {
  it("returns 400 for a missing email", async () => {
    mockAllow = () => Promise.resolve(true);
    const response = await POST(postRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 for a non-string email", async () => {
    mockAllow = () => Promise.resolve(true);
    const response = await POST(postRequest({ email: 123 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAllow = () => Promise.resolve(true);
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns ok: true when the attempt is allowed", async () => {
    mockAllow = () => Promise.resolve(true);
    const response = await POST(postRequest({ email: "user@example.com" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns ok: false when the attempt is rate limited", async () => {
    mockAllow = () => Promise.resolve(false);
    const response = await POST(postRequest({ email: "user@example.com" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: false });
  });

  it("passes the trimmed email through to the rate limiter", async () => {
    let received: string | undefined;
    mockAllow = (email) => {
      received = email;
      return Promise.resolve(true);
    };
    await POST(postRequest({ email: "  user@example.com  " }));
    expect(received).toBe("user@example.com");
  });
});
