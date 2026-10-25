/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic hardening headers on every route. A full Content-Security-Policy
  // is a bigger, separate effort (it would need to account for MapTiler
  // tiles, Supabase, Vercel Analytics, and the Leaflet/OG image pipelines)
  // and is left for a follow-up.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // geolocation stays enabled for this origin - the "Near me"
          // feature genuinely uses it. Everything else this app doesn't
          // use is disabled.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // Nothing in the app needs to be iframed - except /embed below,
          // which is a deliberate, narrow carve-out.
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // The embeddable map widget (see /docs/embedding-widget) is the one
        // page meant to be framed by other sites. It renders no account
        // state - public map data only - so allowing any origin to frame it
        // isn't a privacy or clickjacking risk the way framing an
        // authenticated page would be. A more specific `source` here takes
        // precedence over the blanket DENY above for the same header.
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
