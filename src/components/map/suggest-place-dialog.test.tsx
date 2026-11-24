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
  vi.unstubAllGlobals();
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

function mockApi(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Fails the API call so the dialog switches to the GitHub-issue fallback. */
async function openFallback(onOpenChange = vi.fn()) {
  mockApi(503, { ok: false, reason: "unavailable" });
  render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={onOpenChange} />);
  fillRequiredFields("https://maps.app.goo.gl/abc123");
  fireEvent.click(screen.getByRole("button", { name: "Submit place" }));
  await screen.findByRole("button", { name: "Open GitHub issue" });
  return onOpenChange;
}

describe("SuggestPlaceDialog submission", () => {
  it("rejects an invalid Google Maps URL inline", () => {
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("google maps com/place/x");

    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a valid Google Maps link.",
    );
    expect(
      (screen.getByRole("button", { name: "Submit place" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("posts the form to the API and shows the queued confirmation", async () => {
    const fetchMock = mockApi(201, {
      ok: true,
      issueUrl: "https://github.com/StudentSuite/StudyMap/issues/999",
    });
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit place" }));

    expect(await screen.findByText(/in the queue/)).toBeTruthy();
    const link = screen.getByRole("link", {
      name: "Follow it on GitHub",
    }) as HTMLAnchorElement;
    expect(link.href).toBe("https://github.com/StudentSuite/StudyMap/issues/999");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/submit-place");
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: "Central Library",
      type: "library",
      city: "Mumbai",
      gmapsLink: "https://maps.google.com/?q=19.0176,72.8562",
      contributor: "Asha",
      website: "",
    });
  });

  it("shows a server message and keeps the form on a rate limit", async () => {
    mockApi(429, { ok: false, reason: "rate_limited" });
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");
    fireEvent.click(screen.getByRole("button", { name: "Submit place" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Too many suggestions",
    );
    expect((screen.getByLabelText("Place name") as HTMLInputElement).value).toBe(
      "Central Library",
    );
    expect(screen.queryByRole("button", { name: "Open GitHub issue" })).toBeNull();
  });

  it("falls back to the GitHub issue path when the API is unavailable", async () => {
    await openFallback();
    expect(screen.getByRole("status").textContent).toContain("could not send this");
  });

  it("falls back when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");
    fireEvent.click(screen.getByRole("button", { name: "Submit place" }));

    expect(await screen.findByRole("button", { name: "Open GitHub issue" })).toBeTruthy();
  });

  it("keeps form data and exposes a fallback link when the popup is blocked", async () => {
    const onOpenChange = await openFallback();
    vi.spyOn(window, "open").mockReturnValue(null);
    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect((screen.getByLabelText("Place name") as HTMLInputElement).value).toBe(
      "Central Library",
    );
    expect((screen.getByLabelText("City") as HTMLInputElement).value).toBe("Mumbai");

    const fallback = screen.getByRole("link", {
      name: "Open GitHub here",
    }) as HTMLAnchorElement;
    expect(fallback.href).toContain("github.com/StudentSuite/StudyMap/issues/new?");
    expect(fallback.rel).toBe("noopener noreferrer");
    expect(toastError).toHaveBeenCalledWith(
      "Pop-up blocked. Your suggestion is still here.",
    );
  });

  it("severs opener before navigating a successful popup and closes the dialog", async () => {
    const onOpenChange = await openFallback();
    const replace = vi.fn();
    const opened = {
      opener: window,
      location: { replace },
    } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(opened);
    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    expect(opened.opener).toBeNull();
    expect(replace).toHaveBeenCalledOnce();
    expect(replace.mock.calls[0]?.[0]).toContain(
      "github.com/StudentSuite/StudyMap/issues/new?",
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("SuggestPlaceDialog contact details (#356)", () => {
  function renderForm() {
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("https://maps.google.com/?q=19.0176,72.8562");
  }

  const submitButton = () =>
    screen.getByRole("button", { name: "Submit place" }) as HTMLButtonElement;

  it("offers optional website, phone and opening hours fields", () => {
    renderForm();

    expect(screen.getByLabelText("Place website (optional)")).toBeTruthy();
    expect(screen.getByLabelText("Phone (optional)")).toBeTruthy();
    expect(screen.getByLabelText("Opening hours (optional)")).toBeTruthy();
    expect(submitButton().disabled).toBe(false);
  });

  it("sends the website as placeWebsite and keeps the honeypot field empty", async () => {
    const fetchMock = mockApi(201, {
      ok: true,
      issueUrl: "https://github.com/o/r/issues/1",
    });
    renderForm();
    fireEvent.change(screen.getByLabelText("Place website (optional)"), {
      target: { value: "https://www.bl.uk/" },
    });
    fireEvent.change(screen.getByLabelText("Phone (optional)"), {
      target: { value: "+44 (0)20 7412 7000" },
    });
    fireEvent.change(screen.getByLabelText("Opening hours (optional)"), {
      target: { value: "Mon-Fri 09:30-20:00" },
    });
    fireEvent.click(submitButton());
    await screen.findByText(/in the queue/);

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body).toMatchObject({
      placeWebsite: "https://www.bl.uk/",
      phone: "+442074127000",
      hours: "Mon-Fri 09:30-20:00",
      website: "",
    });
  });

  it("blocks a phone number with no country code and says why", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Phone (optional)"), {
      target: { value: "020 7412 7000" },
    });

    expect(screen.getByRole("alert").textContent).toContain("Include the country code");
    expect(submitButton().disabled).toBe(true);
  });

  it("blocks a website that is not https and says why", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Place website (optional)"), {
      target: { value: "http://www.bl.uk" },
    });

    expect(screen.getByRole("alert").textContent).toContain("https://");
    expect(submitButton().disabled).toBe(true);
  });

  it("allows the fields to be left blank", () => {
    renderForm();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(submitButton().disabled).toBe(false);
  });

  it("puts the contact details into the GitHub issue fallback", async () => {
    mockApi(503, { ok: false, reason: "unavailable" });
    render(<SuggestPlaceDialog datasetCities={[]} open onOpenChange={vi.fn()} />);
    fillRequiredFields("https://maps.app.goo.gl/abc123");
    fireEvent.change(screen.getByLabelText("Phone (optional)"), {
      target: { value: "+442074127000" },
    });
    fireEvent.click(submitButton());
    await screen.findByRole("button", { name: "Open GitHub issue" });
    const replace = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      opener: window,
      location: { replace },
    } as unknown as Window);

    fireEvent.click(screen.getByRole("button", { name: "Open GitHub issue" }));

    const url = new URL(replace.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get("body")).toContain("**Phone:** +442074127000");
  });
});
