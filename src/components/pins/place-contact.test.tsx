import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PlaceContact } from "@/components/pins/place-contact";
import { PinPopup } from "@/components/pins/pin-popup";
import type { Place } from "@/lib/types";

afterEach(cleanup);

const base: Place = {
  id: "lon-library-01",
  name: "British Library",
  type: "library",
  city: "london",
  country: "GB",
  lat: 51.5299,
  lng: -0.1269,
  gmaps_link: "https://maps.google.com/?q=51.5299,-0.1269",
  added_by: "someone",
};

describe("PlaceContact (#356)", () => {
  it("renders nothing for a place with none of the three fields", () => {
    const { container } = render(<PlaceContact place={base} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the fields are blank", () => {
    const { container } = render(
      <PlaceContact place={{ website: "", phone: "  ", hours: "" }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("links the website by its host, opening in a new tab without leaking the opener", () => {
    render(<PlaceContact place={{ website: "https://www.bl.uk/visit" }} />);

    const link = screen.getByRole("link", { name: "bl.uk" });
    expect(link.getAttribute("href")).toBe("https://www.bl.uk/visit");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("makes the phone number a tel: link", () => {
    render(<PlaceContact place={{ phone: "+442074127000" }} />);

    expect(screen.getByRole("link", { name: "+442074127000" }).getAttribute("href")).toBe(
      "tel:+442074127000",
    );
  });

  it("shows the opening hours as text", () => {
    render(<PlaceContact place={{ hours: "Mon-Fri 09:30-20:00" }} />);

    expect(screen.getByText("Mon-Fri 09:30-20:00")).toBeTruthy();
  });

  it("shows only the fields that exist", () => {
    render(<PlaceContact place={{ phone: "+442074127000" }} />);

    expect(screen.queryByRole("link", { name: /bl\.uk/ })).toBeNull();
    expect(screen.queryByText(/Mon-Fri/)).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("does not link a website that is not https", () => {
    render(
      <PlaceContact place={{ website: "javascript:alert(1)", hours: "Open daily" }} />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Open daily")).toBeTruthy();
  });

  it("shows a phone that is not in international form as text, not as a dial link", () => {
    render(<PlaceContact place={{ phone: "020 7412 7000" }} />);

    expect(screen.getByText("020 7412 7000")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("labels each row in the detailed variant", () => {
    render(
      <PlaceContact
        variant="detailed"
        place={{
          website: "https://www.bl.uk",
          phone: "+442074127000",
          hours: "Mon-Fri 09:30-20:00",
        }}
      />,
    );

    expect(screen.getByText("Website")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Opening hours")).toBeTruthy();
  });
});

describe("PinPopup contact details (#356)", () => {
  it("shows the contact details of a place that has them", () => {
    render(
      <PinPopup
        place={{
          ...base,
          website: "https://www.bl.uk",
          phone: "+442074127000",
          hours: "Mon-Fri 09:30-20:00",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "bl.uk" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "+442074127000" })).toBeTruthy();
    expect(screen.getByText("Mon-Fri 09:30-20:00")).toBeTruthy();
  });

  it("renders a place without them exactly as before, with no contact links", () => {
    render(<PinPopup place={base} />);

    expect(screen.queryByRole("link", { name: /^tel|bl\.uk/ })).toBeNull();
    expect(screen.getByText("British Library")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Google Maps/ })).toBeTruthy();
  });
});
