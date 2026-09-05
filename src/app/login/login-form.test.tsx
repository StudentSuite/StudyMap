import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { searchParamsGet } = vi.hoisted(() => ({
  searchParamsGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: {} }),
}));

beforeEach(() => {
  searchParamsGet.mockImplementation((name: string) =>
    name === "error" ? "auth_error" : null,
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginForm OAuth errors", () => {
  it("shows the callback error in a dismissible alert", () => {
    render(<LoginForm />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Sign-in failed or was cancelled. Please try again.",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss sign-in error" }),
    );

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses safe fallback copy for an unknown error code", () => {
    searchParamsGet.mockImplementation((name: string) =>
      name === "error" ? "__proto__" : null,
    );

    render(<LoginForm />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Sign-in failed. Please try again.",
    );
    expect(screen.getByRole("alert").textContent).not.toContain(
      "__proto__",
    );
  });

  it("does not show an alert without an error code", () => {
    searchParamsGet.mockReturnValue(null);

    render(<LoginForm />);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
