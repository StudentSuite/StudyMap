import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompetitionFiltersPanel } from "@/components/competitions/competition-filters";
import { EMPTY_COMPETITION_FILTERS } from "@/components/competitions/filters";

afterEach(cleanup);

describe("CompetitionFiltersPanel", () => {
  it("shows no count when nothing is active, and opens on click", () => {
    const onChange = vi.fn();
    render(
      <CompetitionFiltersPanel
        filters={EMPTY_COMPETITION_FILTERS}
        onChange={onChange}
        regions={["US"]}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Filters/ });
    expect(trigger.textContent).toBe("Filters");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Online" })).toBeTruthy();
  });

  it("shows an active-filter count on the trigger", () => {
    const onChange = vi.fn();
    render(
      <CompetitionFiltersPanel
        filters={{ ...EMPTY_COMPETITION_FILTERS, format: "online", freeOnly: true }}
        onChange={onChange}
        regions={["US"]}
      />,
    );

    expect(screen.getByRole("button", { name: /Filters/ }).textContent).toContain("2");
  });

  it("toggles a pill on and off via onChange", () => {
    const onChange = vi.fn();
    render(
      <CompetitionFiltersPanel
        filters={EMPTY_COMPETITION_FILTERS}
        onChange={onChange}
        regions={["US"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    fireEvent.click(screen.getByRole("button", { name: "Online" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ format: "online" }));
  });

  it("un-toggles a pill that is already active", () => {
    const onChange = vi.fn();
    render(
      <CompetitionFiltersPanel
        filters={{ ...EMPTY_COMPETITION_FILTERS, format: "online" }}
        onChange={onChange}
        regions={["US"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    fireEvent.click(screen.getByRole("button", { name: "Online" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ format: null }));
  });

  it("updates age from the number input", () => {
    const onChange = vi.fn();
    render(
      <CompetitionFiltersPanel
        filters={EMPTY_COMPETITION_FILTERS}
        onChange={onChange}
        regions={["US"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
    fireEvent.change(screen.getByLabelText("Age"), { target: { value: "16" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ age: 16 }));
  });
});
