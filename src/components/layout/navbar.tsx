"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, LogOut, LogIn, Search, UserRound, X } from "lucide-react";

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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const authEnabled = isSupabaseConfigured();

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/map?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

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
          {/* Expandable search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="hidden items-center gap-1 md:flex">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery.trim()) setSearchOpen(false); }}
                  placeholder="Search places..."
                  className="h-8 w-48 rounded-md border border-input bg-background pl-7 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                aria-label="Close search"
              >
                <X className="size-3.5" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={openSearch}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          )}

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
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-5 pt-6 font-heading text-lg font-semibold">
                {site.name}
              </SheetTitle>

              {/* Mobile search */}
              <form
                onSubmit={(e) => { e.preventDefault(); const q = searchQuery.trim(); if (q) { router.push(`/map?q=${encodeURIComponent(q)}`); setOpen(false); setSearchQuery(""); } }}
                className="mx-3 mt-4"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search places..."
                    className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </form>

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
    </header>
  );
}
