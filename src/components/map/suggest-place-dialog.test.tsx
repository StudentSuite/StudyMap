import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SuggestPlaceDialog,
  isGoogleMapsUrl,
} from "@/components/map/suggest-place-dialog";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

afterEach(() => {
  cleanup();
  toastError.mockReset();
  vi.restoreAllMocks();
});

function fillRequiredFields(gmapsLink: string) {
  fireEvent.change(screen.getByLabelText("Place name"), {
    target: { value: "Central Library" },
  });
  fireEvent.change(screen.getByLabelText("City"), {
    target: { value: "Mumbai" },
  });
  fireEvent.change(screen.getByLabelText("Google Maps link"), {
    target: { value: gmapsLink },
  });
}

describe("isGoogleMapsUrl", () => {
  it.each([
    "https://maps.google.com/?q=19.0176,72.8562",
    "https://maps.app.goo.gl/abc123",
    "https://www.google.com/maps/place/Central+Library",
    "https://goo.gl/maps/abc123",
  ])("accepts supported Google Maps URLs: %s", (url) => {
    expect(isGoogleMapsUrl(url)).toBe(true);
  });

  it.each([
    "google maps com/place/x",
    "http://maps.google.com/?q=19.0176,72.8562",
    "https://maps.google.com.evil.example/place/x",
    "https://example.com/maps/place/x",
  ])("rejects malformed or non-Google Maps URLs: %s", (url) => {
    expect(isGoogleMapsUrl(url)).toBe(false);
  });
});

describe("SuggestPlaceDialog submission", () => {
  it("rejects an invalid Google Maps URL inline", () => {
    render(<SuggestPlaceDialog open onOpenChange={vi.fn()} />);
    fillRequiredFields("google maps com/place/x");

    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a valid Google Maps link.",
    );
    expect(
      (screen.getByRole("button", { name: "Open GitHub issue" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("keeps form data and exposes a fallback link when the popup is blocked", () => {
    const onOpenChange = vi.fn();
    vi.spyOn(window, "open").mockReturnValue(null);

    render(<SuggestPlaceDialog open onOpenChange={onOpenChange} />);
    fillRequiredFields("https://maps.app.goo.gl/abc123");
    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect((screen.getByLabelText("Place name") as HTMLInputElement).value).toBe(
      "Central Library",
    );
    expect((screen.getByLabelText("City") as HTMLInputElement).value).toBe("Mumbai");
    expect((screen.getByLabelText("Google Maps link") as HTMLInputElement).value).toBe(
      "https://maps.app.goo.gl/abc123",
    );

    const fallback = screen.getByRole("link", { name: "Open GitHub here" }) as HTMLAnchorElement;
    expect(fallback.href).toContain("github.com/StudentSuite/StudyMap/issues/new?");
    expect(fallback.rel).toBe("noopener noreferrer");
    expect(toastError).toHaveBeenCalledWith("Pop-up blocked. Your suggestion is still here.");
  });

  it("severs opener before navigating a successful popup and closes the dialog", () => {
    const onOpenChange = vi.fn();
    const replace = vi.fn();
    const opened = {
      opener: window,
      location: { replace },
    } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(opened);

    render(<SuggestPlaceDialog open onOpenChange={onOpenChange} />);
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");
    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(opened.opener).toBeNull();
    expect(replace).toHaveBeenCalledOnce();
    expect(replace.mock.calls[0]?.[0]).toContain("github.com/StudentSuite/StudyMap/issues/new?");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
