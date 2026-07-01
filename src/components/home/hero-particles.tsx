"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Particles } from "@/components/ui/particles";

// Brand primary in hex (the Particles canvas needs hex, not a CSS var):
// amber-700 in light, amber-500 in dark. Keep in sync with --primary in globals.css.
const PRIMARY_LIGHT = "#B45309";
const PRIMARY_DARK = "#F59E0B";

/**
 * Restrained, theme-aware particle field for the home hero. Sits behind the
 * hero content (pointer-events-none, aria-hidden via Particles). Renders
 * nothing when the user prefers reduced motion.
 */
export function HeroParticles() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Mount-only reads of browser-only APIs (SSR has no window); there's no
    // prop to derive these from, so an effect-based sync is the only option.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Avoid SSR/theme mismatch and respect reduced-motion: render nothing.
  if (!mounted || reducedMotion) return null;

  const color = resolvedTheme === "dark" ? PRIMARY_DARK : PRIMARY_LIGHT;

  return (
    <Particles
      className="absolute inset-0 -z-10"
      quantity={55}
      ease={80}
      staticity={60}
      size={0.5}
      color={color}
      refresh
    />
  );
}
