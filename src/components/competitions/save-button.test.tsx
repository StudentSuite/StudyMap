import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/competitions",
}));

const saveCompetition = vi.fn();
const unsaveCompetition = vi.fn();
const fetchSaveCounts = vi.fn();
const fetchSavedCompetitionIds = vi.fn();
vi.mock("@/lib/competition-saves", () => ({
  saveCompetition: (...args: unknown[]) => saveCompetition(...args),
  unsaveCompetition: (...args: unknown[]) => unsaveCompetition(...args),
  fetchSaveCounts: (...args: unknown[]) => fetchSaveCounts(...args),
  fetchSavedCompetitionIds: (...args: unknown[]) => fetchSavedCompetitionIds(...args),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

let mockUser: { id: string } | null = { id: "user-1" };
let mockSupabaseClient: unknown = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: mockUser } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

import { SaveButton } from "@/components/competitions/save-button";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SaveButton", () => {
  beforeEach(() => {
    mockUser = { id: "user-1" };
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    saveCompetition.mockResolvedValue(undefined);
    unsaveCompetition.mockResolvedValue(undefined);
    fetchSaveCounts.mockResolvedValue({});
    fetchSavedCompetitionIds.mockResolvedValue([]);
  });

  it("renders nothing when Supabase is not configured", () => {
    mockSupabaseClient = null;
    const { container } = render(
      <SaveButton competitionId="c1" initialSaved={false} initialCount={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("hides the count below 3 and leaves no gap", () => {
    render(<SaveButton competitionId="c1" initialSaved={false} initialCount={2} />);
    expect(screen.queryByText("2")).toBeNull();
  });

  it("shows the count at 3 or more", () => {
    render(<SaveButton competitionId="c1" initialSaved={false} initialCount={3} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("saves optimistically and calls saveCompetition", async () => {
    render(<SaveButton competitionId="c1" initialSaved={false} initialCount={2} />);
    const button = await screen.findByRole("button");

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(saveCompetition).toHaveBeenCalledWith("c1"));
  });

  it("unsaves and decrements the count", async () => {
    render(<SaveButton competitionId="c1" initialSaved={true} initialCount={4} />);
    const button = await screen.findByRole("button");

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("3")).toBeTruthy();
    await waitFor(() => expect(unsaveCompetition).toHaveBeenCalledWith("c1"));
  });

  it("reverts the optimistic update and shows a toast on failure", async () => {
    saveCompetition.mockRejectedValue(new Error("network error"));
    render(<SaveButton competitionId="c1" initialSaved={false} initialCount={2} />);
    const button = await screen.findByRole("button");

    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");

    await waitFor(() => expect(button.getAttribute("aria-pressed")).toBe("false"));
    expect(toastError).toHaveBeenCalled();
  });

  it("prompts sign-in when clicked while signed out, without throwing", () => {
    mockUser = null;
    mockSupabaseClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    render(<SaveButton competitionId="c1" initialSaved={false} initialCount={0} />);
    const button = screen.getByRole("button");

    expect(() => fireEvent.click(button)).not.toThrow();
    expect(push).toHaveBeenCalledWith(expect.stringContaining("/login?next="));
    expect(saveCompetition).not.toHaveBeenCalled();
  });
});
