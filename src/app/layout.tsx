import type { Metadata, Viewport } from "next";
import "./globals.css";

import { inter, spaceGrotesk, jetbrainsMono } from "@/lib/fonts";
import { site } from "@/lib/site";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import { Analytics } from "@/components/analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: student places and benefits`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  // Relative canonical: Next resolves it per-route against metadataBase, so
  // every page gets its own canonical URL and trailing-slash or query-string
  // variants stop reading as separate documents.
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: site.name,
    description: site.tagline,
    url: "./",
    siteName: site.name,
    type: "website",
    locale: "en_US",
    // PNG, not SVG: crawlers (Facebook, X, WhatsApp, iMessage) refuse SVG
    // og:image, so an SVG fallback never unfurls outside the site itself.
    images: ["/brand/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.tagline,
    images: ["/brand/og.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Follows the active theme rather than pinning dark. Both values are the
  // --background token from globals.css (:root and .dark), so the browser
  // chrome matches the page instead of fighting it. next-themes defaults to
  // "system", so prefers-color-scheme is the right signal here.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable,
        spaceGrotesk.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex flex-1 flex-col pt-14">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
          <PwaRegister />
        </ThemeProvider>
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
