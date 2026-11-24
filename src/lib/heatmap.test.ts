import { describe, expect, it } from "vitest";

import { densityCells } from "@/lib/heatmap";

// 1 degree = 100 px, so a 50 px cell is half a degree.
const project = ({ lat, lng }: { lat: number; lng: number }) => ({
  x: lng * 100,
  y: lat * 100,
});

describe("densityCells", () => {
  it("returns nothing for no points", () => {
    expect(densityCells([], project, 50)).toEqual([]);
  });

  it("groups nearby points and averages their position", () => {
    const cells = densityCells(
      [
        { lat: 1.0, lng: 1.0 },
        { lat: 1.2, lng: 1.2 },
        { lat: 5.0, lng: 5.0 },
      ],
      project,
      50,
    );
    expect(cells).toHaveLength(2);
    const busy = cells.find((c) => c.count === 2);
    expect(busy).toMatchObject({ intensity: 1 });
    expect(busy?.lat).toBeCloseTo(1.1);
    expect(busy?.lng).toBeCloseTo(1.1);
    expect(cells.find((c) => c.count === 1)?.intensity).toBeCloseTo(0.5);
  });

  it("keeps points on opposite sides of a cell edge apart", () => {
    const cells = densityCells(
      [
        { lat: 0.1, lng: 0.49 },
        { lat: 0.1, lng: 0.51 },
      ],
      project,
      50,
    );
    expect(cells).toHaveLength(2);
  });

  it("normalises intensity against the busiest cell", () => {
    const points = [
      ...Array.from({ length: 4 }, () => ({ lat: 1, lng: 1 })),
      { lat: 9, lng: 9 },
    ];
    const intensities = densityCells(points, project, 50).map((c) => c.intensity);
    expect(intensities.sort()).toEqual([0.25, 1]);
  });
});
