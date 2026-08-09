import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsList } from "@/components/map/results-list";

describe("ResultsList empty state", () => {
  it("describes active filters and offers reset and contribution actions", () => {
    const onReset = vi.fn();
    const onSuggest = vi.fn();

    render(
      <ResultsList
        header="All places"
        rows={[]}
        emptyState={{
          activeFilters: ["types: Library", "city: Thane"],
          onReset,
          onSuggest,
        }}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "No places match types: Library · city: Thane.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.click(screen.getByRole("button", { name: "Suggest a place" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(onSuggest).toHaveBeenCalledOnce();
  });
});
