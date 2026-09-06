import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getCompetitions, formatCompetitionDate } from "@/lib/competitions";
import { loadHeadingFonts } from "@/lib/og-fonts";
import { ogCompetitionSummary } from "@/lib/og";

// A different image per competition, so shared links stop looking identical
// (same reasoning as the city pages' own image, #122).
export const alt = "StudyMap — student competitions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Every competition detail page is decided at build time from the dataset;
// so is its image. A slug outside the dataset is a 404, never an edge render.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getCompetitions().map((competition) => ({ slug: competition.id }));
}

interface CompetitionOgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompetitionOgImage({ params }: CompetitionOgImageProps) {
  const { slug } = await params;
  const competition = getCompetitions().find((c) => c.id === slug);
  if (!competition) notFound();

  // Computed once, at build time, same as the detail page's own `now` -
  // there is no per-request rendering here for it to drift against.
  const summary = ogCompetitionSummary(competition, new Date());
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

      {/* Category pill */}
      <div
        style={{
          display: "flex",
          marginTop: 48,
          alignSelf: "flex-start",
          background: "#18181B",
          border: "1px solid #27272A",
          borderRadius: 999,
          padding: "8px 20px",
          fontSize: 22,
          color: "#F59E0B",
          fontWeight: 700,
        }}
      >
        {summary.category}
      </div>

      {/* Competition name - kept short and large so it reads at thumbnail size */}
      <div
        style={{
          marginTop: 28,
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.08,
          // next/og has no line-clamp; a hard maxHeight plus overflow hidden
          // keeps a long name from pushing the rest of the card off-canvas.
          maxHeight: 220,
          overflow: "hidden",
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
        {summary.organizer}
      </div>

      {/* Next deadline */}
      {summary.nextDate && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: "auto",
            background: "#18181B",
            border: "1px solid #27272A",
            borderRadius: 999,
            padding: "14px 26px",
            alignSelf: "flex-start",
          }}
        >
          <span style={{ fontSize: 24, color: "#D4D4D8" }}>
            {summary.nextDate.label}:
          </span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#F59E0B" }}>
            {formatCompetitionDate(summary.nextDate.date)}
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: summary.nextDate ? 24 : "auto",
          fontSize: 20,
          color: "#71717A",
        }}
      >
        studyymap.com
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
