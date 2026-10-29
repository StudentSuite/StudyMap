/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic hardening headers on every route. A full Content-Security-Policy
  // is a bigger, separate effort (it would need to account for MapTiler
  // tiles, Supabase, Vercel Analytics, and the Leaflet/OG image pipelines)
  // and is left for a follow-up.
  async headers() {
    return [
      {
        // Every route except /embed. The blanket rule has to leave /embed out: a later, more
        // specific rule cannot remove a header the earlier one set, and /embed was being
        // served with both `X-Frame-Options: DENY` and `frame-ancestors *`. Browsers that
        // let frame-ancestors win framed it; any that honoured DENY would not.
        source: "/((?!embed(?:/|$)).*)",
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
        // authenticated page would be. The rule above skips this path, so no
        // X-Frame-Options header is sent and `frame-ancestors` is the only
        // framing policy. Anything added to /embed that reads account state
        // needs a review of this carve-out first (see #311).
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
