import Link from "next/link";

import { site } from "@/lib/site";

const quickLinks = [
  { href: "/map", label: "Map" },
  { href: "/calendar", label: "Exam Calendar" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
  { href: "/docs", label: "Docs" },
];

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-4">
          {/* About */}
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">{site.name}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Open-source student places map. Free &amp; forever.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-medium text-foreground">Quick Links</p>
            <nav className="mt-4 flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="font-medium text-foreground">Legal</p>
            <nav className="mt-4 flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact & Social */}
          <div>
            <p className="font-medium text-foreground">Connect</p>
            <nav className="mt-4 flex flex-col gap-2">
              <a
                href="mailto:studentsuite0@gmail.com"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Email
              </a>
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://instagram.com/studentsuite"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Instagram
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>&copy; 2026 {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
