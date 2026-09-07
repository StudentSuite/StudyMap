import { readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "@vercel/og";

const svg = readFileSync("public/brand/og.svg", "utf8");

const png = await new ImageResponse(svg, {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "'Space Grotesk', ui-sans-serif, sans-serif",
      data: readFileSync("assets/fonts/SpaceGrotesk-Bold.ttf"),
      weight: 700,
    },
    {
      name: "'Inter', ui-sans-serif, sans-serif",
      data: readFileSync("assets/fonts/SpaceGrotesk-Regular.ttf"),
      weight: 400,
    },
  ],
});

writeFileSync("public/brand/og.png", Buffer.from(await png.arrayBuffer()));
console.log("wrote public/brand/og.png");
