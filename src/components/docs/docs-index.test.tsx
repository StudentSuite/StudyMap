import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DocsIndex } from "@/components/docs/docs-index";
import { DOCS_GROUPS } from "@/lib/docs-nav";

afterEach(cleanup);

describe("DocsIndex", () => {
  it("defaults to list view with every group heading visible", () => {
    render(<DocsIndex />);

    expect(
      screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed"),
    ).toBe("true");
    for (const group of DOCS_GROUPS) {
      expect(screen.getAllByText(group).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Read guide")).toBeNull();
  });

  it("switches to grid view on click, keyboard-operable via aria-pressed", () => {
    render(<DocsIndex />);

    const gridButton = screen.getByRole("button", { name: "Grid" });
    expect(gridButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(gridButton);

    expect(gridButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    // Grid view renders the restored icon-card layout's own copy.
    expect(screen.getAllByText("Read guide").length).toBeGreaterThan(0);
  });
});
