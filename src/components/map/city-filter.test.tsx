import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CityFilter } from "@/components/map/city-filter";
import type { City } from "@/lib/types";

afterEach(cleanup);

const CITIES: City[] = ["mumbai", "navi_mumbai", "istanbul", "nairobi"];

function field() {
  return screen.getByLabelText("Filter by city") as HTMLInputElement;
}

function optionValues() {
  return Array.from(document.querySelectorAll("datalist option")).map((o) =>
    o.getAttribute("value"),
  );
}

// A parent that owns the value, like MapPanel does through the filters object.
function Harness({
  initial = null,
  onChange = () => {},
}: {
  initial?: City | null;
  onChange?: (city: City | null) => void;
}) {
  const [city, setCity] = React.useState<City | null>(initial);
  return (
    <>
      <CityFilter
        cities={CITIES}
        value={city}
        onChange={(next) => {
          setCity(next);
          onChange(next);
        }}
      />
      <button onClick={() => setCity(null)}>external reset</button>
    </>
  );
}

describe("CityFilter", () => {
  it("offers every city as a suggestion, labelled like the old dropdown", () => {
    render(<Harness />);
    expect(optionValues()).toEqual(["Mumbai", "Navi Mumbai", "Istanbul", "Nairobi"]);
    expect(field().getAttribute("list")).toBeTruthy();
    expect(field().placeholder).toBe("All cities");
  });

  it("selects the city when the typed or picked text matches a suggestion", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "Istanbul" } });

    expect(onChange).toHaveBeenCalledWith("istanbul");
  });

  it("matches regardless of case and surrounding spaces", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(field(), { target: { value: " navi mumbai " } });

    expect(onChange).toHaveBeenCalledWith("navi_mumbai");
  });

  it("does not change the filter while the text is only a partial match", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(field(), { target: { value: "ist" } });

    expect(onChange).not.toHaveBeenCalled();
    expect(field().value).toBe("ist");
  });

  it("returns to all cities when the field is cleared", () => {
    const onChange = vi.fn();
    render(<Harness initial="mumbai" onChange={onChange} />);
    expect(field().value).toBe("Mumbai");

    fireEvent.change(field(), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clears with the clear button", () => {
    const onChange = vi.fn();
    render(<Harness initial="nairobi" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear city filter" }));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(field().value).toBe("");
    expect(screen.queryByRole("button", { name: "Clear city filter" })).toBeNull();
  });

  it("restores the selected city's name when leaving a half-typed field", () => {
    render(<Harness initial="mumbai" />);

    fireEvent.change(field(), { target: { value: "xyz" } });
    expect(field().value).toBe("xyz");
    fireEvent.blur(field());

    expect(field().value).toBe("Mumbai");
  });

  it("follows the filter when it is reset from outside", () => {
    render(<Harness initial="istanbul" />);
    expect(field().value).toBe("Istanbul");

    fireEvent.click(screen.getByText("external reset"));

    expect(field().value).toBe("");
  });

  it("gives each instance its own suggestion list", () => {
    render(
      <>
        <CityFilter cities={CITIES} value={null} onChange={() => {}} />
        <CityFilter cities={CITIES} value={null} onChange={() => {}} />
      </>,
    );
    const lists = Array.from(document.querySelectorAll("datalist")).map((d) => d.id);
    expect(new Set(lists).size).toBe(2);
  });
});
