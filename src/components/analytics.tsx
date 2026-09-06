import Script from "next/script";

/**
 * Umami analytics, loaded only in production and only when a website ID is set.
 * Privacy-friendly and cookieless. Set NEXT_PUBLIC_UMAMI_WEBSITE_ID (and
 * optionally NEXT_PUBLIC_UMAMI_SRC for a self-hosted instance) to enable it.
 */
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const SRC = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

export function Analytics() {
  if (process.env.NODE_ENV !== "production" || !WEBSITE_ID) {
    return null;
  }

  return <Script src={SRC} data-website-id={WEBSITE_ID} strategy="afterInteractive" />;
}
