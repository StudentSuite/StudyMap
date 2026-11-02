import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AboutPage from "@/app/about/page";

afterEach(cleanup);

describe("About page", () => {
  it("lists the top contributors from the dataset", () => {
    render(<AboutPage />);

    expect(screen.getByText("Top contributors")).toBeTruthy();
  });
});
