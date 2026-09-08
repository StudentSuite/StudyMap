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
          // Nothing in the app needs to be iframed.
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
