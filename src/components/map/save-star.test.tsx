import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SavedPlacesProvider, SaveStar } from "@/components/map/save-star";

afterEach(cleanup);

function renderStar(saved: string[], toggle = vi.fn()) {
  render(
    <SavedPlacesProvider value={{ isSaved: (id) => saved.includes(id), toggle }}>
      <SaveStar placeId="mum-library-07" placeName="City Library" />
    </SavedPlacesProvider>,
  );
  return toggle;
}

describe("SaveStar (#355)", () => {
  it("renders nothing where no saved list is provided, such as an embed", () => {
    const { container } = render(<SaveStar placeId="a" placeName="A" />);
    expect(container.firstChild).toBeNull();
  });

  it("offers to save a place that is not saved, naming it", () => {
    renderStar([]);
    const button = screen.getByRole("button", { name: "Save City Library" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("offers to remove a place that is saved, naming it", () => {
    renderStar(["mum-library-07"]);
    const button = screen.getByRole("button", { name: "Remove City Library from saved" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("toggles that place when pressed", () => {
    const toggle = renderStar([]);
    fireEvent.click(screen.getByRole("button", { name: "Save City Library" }));
    expect(toggle).toHaveBeenCalledWith("mum-library-07");
  });

  it("does not let the press reach the row or pin underneath it", () => {
    const onRowClick = vi.fn();
    const toggle = vi.fn();
    render(
      <SavedPlacesProvider value={{ isSaved: () => false, toggle }}>
        <div onClick={onRowClick}>
          <SaveStar placeId="a" placeName="A" />
        </div>
      </SavedPlacesProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save A" }));

    expect(toggle).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
