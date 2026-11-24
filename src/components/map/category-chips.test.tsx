import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryChips, EXAM_COMBO, matchesCombo } from "@/components/map/category-chips";
import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/types";
import type { PlaceType } from "@/lib/types";

afterEach(cleanup);

const counts = Object.fromEntries(PLACE_TYPES.map((type, i) => [type, i + 1])) as Record<
  PlaceType,
  number
>;

describe("CategoryChips (#352)", () => {
  it("renders one chip per type, labelled exactly as PLACE_TYPE_LABELS", () => {
    render(<CategoryChips selected={[]} counts={counts} onToggle={vi.fn()} />);

    const group = screen.getByRole("group", { name: "Filter by place type" });
    for (const type of PLACE_TYPES) {
      expect(group.textContent).toContain(PLACE_TYPE_LABELS[type]);
    }
  });

  it("is the only filter row: no second preset group", () => {
    render(
      <CategoryChips
        selected={[]}
        counts={counts}
        onToggle={vi.fn()}
        onSetTypes={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.queryByRole("group", { name: "Filter presets" })).toBeNull();
    expect(screen.getAllByRole("group")).toHaveLength(1);
  });

  it("toggles a single type", () => {
    const onToggle = vi.fn();
    render(<CategoryChips selected={[]} counts={counts} onToggle={onToggle} />);

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(PLACE_TYPE_LABELS.airport) }),
    );

    expect(onToggle).toHaveBeenCalledWith("airport");
  });

  it("offers the exam-centres combo only when onSetTypes is given", () => {
    const { rerender } = render(
      <CategoryChips selected={[]} counts={counts} onToggle={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /All exam centres/ })).toBeNull();

    rerender(
      <CategoryChips
        selected={[]}
        counts={counts}
        onToggle={vi.fn()}
        onSetTypes={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /All exam centres/ })).toBeTruthy();
  });

  it("selects both exam types from the combo chip, and clears them on a second tap", () => {
    const onSetTypes = vi.fn();
    const { rerender } = render(
      <CategoryChips
        selected={[]}
        counts={counts}
        onToggle={vi.fn()}
        onSetTypes={onSetTypes}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /All exam centres/ }));
    expect(onSetTypes).toHaveBeenLastCalledWith([...EXAM_COMBO]);

    rerender(
      <CategoryChips
        selected={[...EXAM_COMBO]}
        counts={counts}
        onToggle={vi.fn()}
        onSetTypes={onSetTypes}
      />,
    );
    const chip = screen.getByRole("button", { name: /All exam centres/ });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip);
    expect(onSetTypes).toHaveBeenLastCalledWith([]);
  });

  it("shows a selected count and a Clear action only while something is selected", () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <CategoryChips
        selected={[]}
        counts={counts}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();

    rerender(
      <CategoryChips
        selected={["library", "airport"]}
        counts={counts}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );
    expect(screen.getByText(/2 categories selected/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("uses the singular for one selected category", () => {
    render(
      <CategoryChips
        selected={["library"]}
        counts={counts}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 category selected/)).toBeTruthy();
  });

  it("fades the right edge of the scrolling row instead of clipping a chip", () => {
    render(<CategoryChips selected={[]} counts={counts} onToggle={vi.fn()} scroll />);

    const group = screen.getByRole("group", { name: "Filter by place type" });
    expect(group.className).toContain("overflow-x-auto");
    expect(group.className).toContain("mask-image");
  });
});

describe("matchesCombo", () => {
  it("matches the same types in any order", () => {
    expect(matchesCombo(["foreign_lang_exam_centre", "sat_centre"], EXAM_COMBO)).toBe(
      true,
    );
  });

  it("does not match a subset, a superset or an empty selection", () => {
    expect(matchesCombo(["sat_centre"], EXAM_COMBO)).toBe(false);
    expect(matchesCombo([...EXAM_COMBO, "library"], EXAM_COMBO)).toBe(false);
    expect(matchesCombo([], EXAM_COMBO)).toBe(false);
  });
});
