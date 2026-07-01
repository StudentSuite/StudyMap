"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Mount-only flag to avoid an SSR/hydration mismatch (next-themes can't
  // know the resolved theme on the server); there's no prop to derive this from.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={mounted && isDark ? "bg-muted text-foreground" : ""}
    >
      {mounted && isDark ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  );
}
