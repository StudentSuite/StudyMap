import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { cityPageSlugs, findCityPage } from "@/lib/city-pages";
import { loadHeadingFonts } from "@/lib/og-fonts";
import { getPlaces } from "@/lib/places";
import { ogCitySummary } from "@/lib/og";

// A different image per city, so shared links stop looking identical (#122).
export const alt = "StudyMap — student places and benefits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The city pages are decided at build time from the dataset; so are their
// images. A slug outside the dataset is a 404, never an edge render.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return cityPageSlugs(getPlaces());
}

interface CityOgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function CityOgImage({ params }: CityOgImageProps) {
  const { slug } = await params;
  const page = findCityPage(getPlaces(), slug);
  if (!page) notFound();

  const summary = ogCitySummary(page);
  const fonts = (await loadHeadingFonts()).map(({ data, weight }) => ({
    data,
    name: "Space Grotesk",
    weight,
    style: "normal" as const,
  }));
  const fontFamily = '"Space Grotesk", "Inter", system-ui, sans-serif';

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0A0A0A",
        color: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        padding: "64px 76px",
        fontFamily,
      }}
    >
      {/* Wordmark: the StudyMap pin mark + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            background: "#F59E0B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ width: 12, height: 12, borderRadius: 999, background: "#0A0A0A" }}
          />
        </div>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>
          StudyMap
        </span>
      </div>

      {/* City name */}
      <div
        style={{
          marginTop: 104,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.02,
        }}
      >
        {summary.name}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 18,
          fontSize: 28,
          color: "#A1A1AA",
        }}
      >
        {summary.total} student place{summary.total === 1 ? "" : "s"} · crowdsourced
      </div>

      {/* Category counts */}
      {summary.counts.length > 0 && (
        <div style={{ display: "flex", gap: 14, marginTop: 52, flexWrap: "wrap" }}>
          {summary.counts.map((count) => (
            <div
              key={count.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#18181B",
                border: "1px solid #27272A",
                borderRadius: 999,
                padding: "14px 26px",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>
                {count.count}
              </span>
              <span style={{ fontSize: 24, color: "#D4D4D8" }}>{count.label}</span>
            </div>
          ))}
          {summary.more > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "transparent",
                border: "1px solid #27272A",
                borderRadius: 999,
                padding: "14px 26px",
                fontSize: 24,
                color: "#71717A",
              }}
            >
              +{summary.more} more
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "auto", fontSize: 20, color: "#71717A" }}>
        studyymap.com
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
