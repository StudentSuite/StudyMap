import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const ensureProfileRow = vi.fn();
const saveProfileStep = vi.fn();

vi.mock("@/lib/user-profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/user-profile")>();
  return {
    ...actual,
    ensureProfileRow: (...args: unknown[]) => ensureProfileRow(...args),
    saveProfileStep: (...args: unknown[]) => saveProfileStep(...args),
  };
});

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

const BLANK_PROFILE = {
  user_id: "u1",
  graduation_year: null,
  board: null,
  field: null,
  country: null,
  referral_source: null,
  referral_other: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OnboardingFlow", () => {
  it("starts at step 1 of 5 once the blank profile row resolves", async () => {
    ensureProfileRow.mockResolvedValue(BLANK_PROFILE);
    render(<OnboardingFlow next="/map" />);

    await screen.findByRole("heading", { name: "When are you graduating?" });
    expect(screen.getByText("Step 1 of 5")).not.toBeNull();
  });

  it("resumes at the first unanswered step for a returning user", async () => {
    ensureProfileRow.mockResolvedValue({
      ...BLANK_PROFILE,
      graduation_year: 2027,
      board: "IB",
    });
    render(<OnboardingFlow next="/map" />);

    await screen.findByRole("heading", { name: "What field are you focused on?" });
    expect(screen.getByText("Step 3 of 5")).not.toBeNull();
  });

  it("Skip for now advances without persisting a value", async () => {
    ensureProfileRow.mockResolvedValue(BLANK_PROFILE);
    render(<OnboardingFlow next="/map" />);

    await screen.findByRole("heading", { name: "When are you graduating?" });
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    await screen.findByRole("heading", { name: "What board are you on?" });
    expect(saveProfileStep).not.toHaveBeenCalled();
  });

  it("skipping through every step reaches the end and redirects to next", async () => {
    ensureProfileRow.mockResolvedValue(BLANK_PROFILE);
    render(<OnboardingFlow next="/map" />);

    await screen.findByRole("heading", { name: "When are you graduating?" });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
      await waitFor(() => expect(screen.queryByText(`Step ${i + 1} of 5`)).toBeNull());
    }
    expect(screen.getByText("Step 5 of 5")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/map"));
  });

  it("falls back to next instead of throwing when the table doesn't exist yet", async () => {
    ensureProfileRow.mockRejectedValue({ code: "PGRST205" });
    render(<OnboardingFlow next="/map" />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/map"));
  });
});
