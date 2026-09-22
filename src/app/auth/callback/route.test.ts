import { describe, expect, it, vi, beforeEach } from "vitest";

let mockConfigured = true;
vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => mockConfigured,
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: () => {} }),
}));

interface ExchangeResult {
  data: { redirectType?: string | null } | null;
  error: { message: string } | null;
}
interface ProfileLookupResult {
  data: { user_id: string } | null;
  error: { message: string } | null;
}

let mockExchangeResult: ExchangeResult;
let mockUser: { id: string } | null;
let mockProfileLookup: ProfileLookupResult;

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: () => Promise.resolve(mockExchangeResult),
      getUser: () => Promise.resolve({ data: { user: mockUser } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(mockProfileLookup),
        }),
      }),
    }),
  }),
}));

import { GET } from "./route";

const SITE_URL = "https://studyymap.com";

function request(path: string): Request {
  return new Request(`http://localhost${path}`);
}

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

beforeEach(() => {
  mockConfigured = true;
  mockExchangeResult = { data: { redirectType: null }, error: null };
  mockUser = { id: "user-1" };
  mockProfileLookup = { data: { user_id: "user-1" }, error: null };
});

describe("GET /auth/callback (route handler)", () => {
  it("redirects home when Supabase isn't configured", async () => {
    mockConfigured = false;
    const response = await GET(request("/auth/callback?code=abc"));
    expect(locationOf(response)).toBe(`${SITE_URL}/`);
  });

  it("redirects to the generic auth error when there is no code", async () => {
    const response = await GET(request("/auth/callback"));
    expect(locationOf(response)).toBe(`${SITE_URL}/login?error=auth_error`);
  });

  it("redirects to next after a normal OAuth sign-in with an existing profile", async () => {
    const response = await GET(request("/auth/callback?code=abc&next=%2Fmap"));
    expect(locationOf(response)).toBe(`${SITE_URL}/map`);
  });

  it("redirects to onboarding on first sign-in (no profile row yet)", async () => {
    mockProfileLookup = { data: null, error: null };
    const response = await GET(request("/auth/callback?code=abc&next=%2Fmap"));
    expect(locationOf(response)).toBe(`${SITE_URL}/onboarding?next=%2Fmap`);
  });

  it("detects recovery via Supabase's own redirectType and flags type=recovery", async () => {
    mockExchangeResult = { data: { redirectType: "recovery" }, error: null };
    const response = await GET(request("/auth/callback?code=abc&next=%2Flogin"));
    expect(locationOf(response)).toBe(`${SITE_URL}/login?type=recovery`);
  });

  it("detects recovery via the first-party flow=recovery marker even without redirectType", async () => {
    mockExchangeResult = { data: { redirectType: null }, error: null };
    const response = await GET(
      request("/auth/callback?code=abc&next=%2Flogin&flow=recovery"),
    );
    expect(locationOf(response)).toBe(`${SITE_URL}/login?type=recovery`);
  });

  it("returns a recovery-specific error when the code exchange fails for a recovery link", async () => {
    mockExchangeResult = { data: null, error: { message: "invalid flow state" } };
    const response = await GET(
      request("/auth/callback?code=abc&next=%2Flogin&flow=recovery"),
    );
    expect(locationOf(response)).toBe(`${SITE_URL}/login?error=recovery_link_invalid`);
  });

  it("returns the generic auth error when the code exchange fails for a non-recovery request", async () => {
    mockExchangeResult = { data: null, error: { message: "invalid grant" } };
    const response = await GET(request("/auth/callback?code=abc"));
    expect(locationOf(response)).toBe(`${SITE_URL}/login?error=auth_error`);
  });
});
