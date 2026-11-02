import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrivacyPage from "@/app/legal/privacy/page";

afterEach(cleanup);

describe("Privacy policy", () => {
  it("names every service that sees visitor or account data", () => {
    render(<PrivacyPage />);

    for (const service of [
      "Supabase",
      "Google",
      "Vercel Analytics",
      "Umami",
      "MapTiler",
    ]) {
      expect(screen.getAllByText(service).length, service).toBeGreaterThan(0);
    }
  });

  it("covers the per-account data the app stores", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";

    for (const phrase of [
      "Saved places",
      "home location",
      "Calendar events",
      "Competitions you save",
      "graduation year",
    ]) {
      expect(text.toLowerCase(), phrase).toContain(phrase.toLowerCase());
    }
  });

  it("says Near me stays in the browser", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.textContent).toMatch(/Near me[\s\S]*not sent to StudyMap/);
  });

  it("gives a contact address for deletion requests and a current date", () => {
    render(<PrivacyPage />);

    const link = screen.getByRole("link", { name: "studentsuite3@gmail.com" });
    expect(link.getAttribute("href")).toBe("mailto:studentsuite3@gmail.com");
    expect(screen.getByText(/Last updated: November 2026/)).toBeTruthy();
  });

  it("does not use em dashes", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.textContent).not.toContain("—");
  });
});
