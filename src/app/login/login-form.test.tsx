import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { searchParamsGet } = vi.hoisted(() => ({
  searchParamsGet: vi.fn(),
}));

const routerPush = vi.fn();
const routerRefresh = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

vi.mock("@/lib/user-profile", () => ({
  hasSeenOnboarding: () => Promise.resolve(true),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  }),
}));

beforeEach(() => {
  searchParamsGet.mockImplementation((name: string) =>
    name === "error" ? "auth_error" : null,
  );
  resetPasswordForEmail.mockResolvedValue({ error: null });
  updateUser.mockResolvedValue({ error: null });
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

    fireEvent.click(screen.getByRole("button", { name: "Dismiss sign-in error" }));

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
    expect(screen.getByRole("alert").textContent).not.toContain("__proto__");
  });

  it("does not show an alert without an error code", () => {
    searchParamsGet.mockReturnValue(null);

    render(<LoginForm />);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("LoginForm password reset", () => {
  it("switches to the forgot-password form, which asks only for an email", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));

    expect(screen.getByText("Reset your password")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeTruthy();
  });

  it("requests a reset link with a redirect back through /auth/callback", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(resetPasswordForEmail).toHaveBeenCalledTimes(1));
    const [email, options] = resetPasswordForEmail.mock.calls[0];
    expect(email).toBe("student@example.com");
    expect(options.redirectTo).toMatch(/\/auth\/callback\?next=%2Flogin$/);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("shows an error toast when the reset request fails", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: new Error("rate limited") });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("rate limited"));
  });

  it("can go back to sign-in from the forgot-password form", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));

    expect(screen.getByText("Sign in to continue")).toBeTruthy();
  });

  it("lands directly on the update-password form when the URL flags type=recovery", () => {
    searchParamsGet.mockImplementation((name: string) =>
      name === "type" ? "recovery" : null,
    );

    render(<LoginForm />);

    expect(screen.getByText("Choose a new password")).toBeTruthy();
    expect(screen.getByLabelText("New password")).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("submits the new password via updateUser and redirects to next", async () => {
    searchParamsGet.mockImplementation((name: string) =>
      name === "type" ? "recovery" : name === "next" ? "/map" : null,
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "a-new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: "a-new-password" }),
    );
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/map"));
    expect(routerRefresh).toHaveBeenCalled();
  });
});
