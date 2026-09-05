import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/competitions/saved",
}));

const fetchSavedCompetitionIds = vi.fn();
const fetchSaveCounts = vi.fn();
vi.mock("@/lib/competition-saves", () => ({
  fetchSavedCompetitionIds: (...args: unknown[]) => fetchSavedCompetitionIds(...args),
  fetchSaveCounts: (...args: unknown[]) => fetchSaveCounts(...args),
  saveCompetition: vi.fn(),
  unsaveCompetition: vi.fn(),
}));

let mockSupabaseClient: unknown = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

import SavedCompetitionsPage from "@/app/competitions/saved/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SavedCompetitionsPage", () => {
  beforeEach(() => {
    fetchSaveCounts.mockResolvedValue({});
  });

  it("shows the preview-mode card when Supabase isn't configured", () => {
    mockSupabaseClient = null;
    render(<SavedCompetitionsPage />);
    expect(screen.getByText(/isn't available on this deployment/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Browse competitions" })).toBeTruthy();
  });

  it("prompts sign-in when signed out", async () => {
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    render(<SavedCompetitionsPage />);
    expect(
      await screen.findByText("Sign in to see the competitions you've saved."),
    ).toBeTruthy();
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.getAttribute("href")).toBe("/login?next=/competitions/saved");
  });

  it("shows a useful empty state linking back to /competitions when signed in with no saves", async () => {
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    fetchSavedCompetitionIds.mockResolvedValue([]);

    render(<SavedCompetitionsPage />);

    await waitFor(() =>
      expect(screen.getByText("You haven't saved any competitions yet.")).toBeTruthy(),
    );
    const link = screen.getByRole("link", { name: "Browse competitions" });
    expect(link.getAttribute("href")).toBe("/competitions");
  });

  it("renders saved competitions when the user has some", async () => {
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    fetchSavedCompetitionIds.mockResolvedValue(["regeneron-isef"]);

    render(<SavedCompetitionsPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Regeneron International Science and Engineering Fair (ISEF)"),
      ).toBeTruthy(),
    );
  });
});
