"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, LogOut, LogIn, Search, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { navLinks, primaryNavLinks, secondaryNavLinks, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Lazily loaded: it pulls in the full places and competitions datasets to
// search over, which don't belong in every page's initial JS bundle — only
// fetched the first time someone actually opens search (see site-search.tsx).
const SiteSearchDialog = dynamic(
  () => import("@/components/layout/site-search").then((m) => m.SiteSearchDialog),
  { ssr: false },
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  // Separate from searchDialogOpen so the lazy SiteSearchDialog chunk (and
  // the place/competition datasets it pulls in) is fetched once, the first
  // time search opens, but stays mounted afterwards so later opens/closes
  // keep their enter/exit animation instead of hard-cutting on unmount.
  const [searchLoaded, setSearchLoaded] = React.useState(false);

  const authEnabled = isSupabaseConfigured();

  function openSearch() {
    setSearchLoaded(true);
    setSearchDialogOpen(true);
  }

  // Global shortcuts: Cmd/Ctrl+K or "/" opens site search, from anywhere
  // except while already typing in a text field.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMeta = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (!isMeta && !isSlash) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;
      if (isSlash && isTyping) return;

      e.preventDefault();
      setOpen(false);
      openSearch();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user)).catch(() => setLoggedIn(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setLoggedIn(!!session),
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed top-0 inset-x-0 z-[1100] w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark, no optimization needed */}
          <img src="/logo-light.svg" alt={site.name} width={180} height={34} className="h-7 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG wordmark, no optimization needed */}
          <img src="/logo-dark.svg" alt={site.name} width={180} height={34} className="hidden h-7 w-auto dark:block" />
        </Link>

        {/* Desktop nav: primary links + More dropdown */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                isActive(link.href) && "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  secondaryNavLinks.some((l) => isActive(l.href)) && "bg-muted text-foreground",
                )}
              >
                More
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {secondaryNavLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(isActive(link.href) && "bg-accent")}
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop search + actions */}
        <div className="ml-auto flex items-center gap-1">
          {/* Site search: opens the command-palette-style search dialog (issue #222). */}
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-8"
            onClick={openSearch}
            aria-label="Search (Cmd/Ctrl+K)"
          >
            <Search className="size-4" />
          </Button>

          <ThemeToggle />
          {authEnabled &&
            (loggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Your account"
                  className="hidden md:inline-flex"
                >
                  <Link href="/account" aria-current={isActive("/account") ? "page" : undefined}>
                    <UserRound className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="hidden md:inline-flex"
                >
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:inline-flex gap-1.5"
              >
                <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                  <LogIn className="size-4" />
                  Sign in
                </Link>
              </Button>
            ))}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-5 pt-6 font-heading text-lg font-semibold">
                {site.name}
              </SheetTitle>

              <nav className="mt-4 flex flex-col gap-1 px-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-3 text-xl font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] text-muted-foreground hover:bg-muted hover:text-foreground",
                      isActive(link.href) && "text-primary",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              {authEnabled && (
                <div className="mt-4 border-t px-3 pt-4">
                  {loggedIn ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setOpen(false)}
                        aria-current={isActive("/account") ? "page" : undefined}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <UserRound className="size-4" />
                        Your account
                      </Link>
                      <button
                        onClick={() => { setOpen(false); handleSignOut(); }}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(pathname)}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <LogIn className="size-4" />
                      Sign in
                    </Link>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchLoaded && (
        <SiteSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
      )}
    </header>
  );
}
