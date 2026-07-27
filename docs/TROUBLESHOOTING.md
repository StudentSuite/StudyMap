# Troubleshooting

Common problems when running StudyMap locally or on a fork, and what actually causes them.

## Map doesn't load, or the basemap is blank/grey

Almost always a missing or invalid `NEXT_PUBLIC_MAPTILER_KEY`. The map tiles come from
MapTiler, and unlike the Supabase variables, this one is required - the basemap will not
render without it. Get a free key at
[cloud.maptiler.com](https://cloud.maptiler.com/account/keys/), add it to `.env.local`, and
restart the dev server (env vars are only read on boot).

## Signed in, but saved places or the calendar show an error

This means the Supabase tables exist for auth but not for the app's own data (saved places,
home location, personal calendar events). Code already catches this: `isMissingTableError()`
in `src/lib/utils.ts` checks for Postgres error `PGRST205` ("table not found in schema cache")
and shows a message pointing here instead of a generic failure.

Fix: in the Supabase SQL editor, run every file in `supabase/migrations/`, in filename order.
See [SELF-HOSTING.md](../SELF-HOSTING.md) for the full self-host setup.

If you don't need auth at all, leave the Supabase env vars blank. The map, search, filters,
and calendar all work without them - you just lose sign-in, saved places, and personal events.

## "Near me" doesn't work

- **No prompt appeared, or it's silently doing nothing**: the browser doesn't support the
  Geolocation API, or the page isn't served over HTTPS (required by most browsers outside
  `localhost`).
- **"Could not read your location"**: location permission was denied, or the device couldn't
  get a fix. Check the browser's site permissions and try again.
- **Location seems wrong**: some browsers fall back to IP-based location when GPS/Wi-Fi
  positioning is unavailable, which can be off by kilometers, especially on desktop.

## The app looks out of date after a deploy

That's usually a PWA caching issue. See [OFFLINE_CACHING.md](OFFLINE_CACHING.md) for what gets
cached and how to force a fresh load.

## Still stuck

Open an issue at [github.com/StudentSuite/StudyMap/issues](https://github.com/StudentSuite/StudyMap/issues)
or email [studentsuite0@gmail.com](mailto:studentsuite0@gmail.com).
