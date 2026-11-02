import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Hero } from "@/components/home/hero";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/home/map-preview", () => ({ MapPreview: () => null }));
vi.mock("@/components/home/hero-particles", () => ({ HeroParticles: () => null }));

afterEach(cleanup);

describe("Hero", () => {
  it("offers a jump-to-city control", () => {
    render(<Hero />);

    expect(screen.getByRole("combobox", { name: "Jump to a city" })).toBeTruthy();
  });
});
