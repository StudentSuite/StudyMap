import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterPresets } from "@/components/map/filter-presets";

afterEach(cleanup);

describe("FilterPresets", () => {
  it("lists the preset buttons in a labelled group", () => {
    render(<FilterPresets onApply={vi.fn()} />);

    const group = screen.getByRole("group", { name: "Filter presets" });
    expect(group).toBeTruthy();
    for (const label of [
      "Libraries",
      "SAT centres",
      "Exam centres",
      "Govt offices",
      "Airports",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("applies one type for a single-type preset", () => {
    const onApply = vi.fn();
    render(<FilterPresets onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Airports" }));

    expect(onApply).toHaveBeenCalledWith(["airport"]);
  });

  it("applies both exam types for the Exam centres preset", () => {
    const onApply = vi.fn();
    render(<FilterPresets onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Exam centres" }));

    expect(onApply).toHaveBeenCalledWith(["sat_centre", "foreign_lang_exam_centre"]);
  });
});
