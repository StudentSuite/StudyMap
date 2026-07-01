# Offline caching and stale content

StudyMap is a Progressive Web App (PWA). It registers a service worker
(`public/sw.js`) so the map still opens on exam day with a weak or absent
signal. This also means the app can keep serving cached content after a
deploy ships, which can look like "the fix never happened" when really your
browser or installed PWA is still holding the previous version.

## What gets cached

The service worker keeps two caches, both versioned by `VERSION` in
`public/sw.js`:

- **App cache** (`app-<version>`): the app shell (`/`, `/offline`,
  `/manifest.webmanifest`), plus build output under `/_next/static` and
  `/icons`. Static build assets are cache-first since they're
  content-hashed and never change under the same URL. Page navigations try
  the network first and fall back to the cache when offline.
- **Tile cache** (`tiles-<version>`): map tiles from `api.maptiler.com`,
  cache-first, capped at 300 tiles so it doesn't grow unbounded.

On every deploy, `VERSION` changes, which causes the new service worker to
delete all caches that don't match the new version on activation. In most
cases a normal reload picks up the new version automatically. Staleness
happens when the browser hasn't fetched the new `sw.js` yet, usually because
the old service worker is still controlling the page or the browser served
`sw.js` itself from an HTTP cache.

## Forcing a fresh load

If the map or UI looks out of date after a known deploy, try these in order:

1. **Hard refresh**: reload while bypassing the cache (Cmd+Shift+R on
   Mac, Ctrl+Shift+R on Windows/Linux, or Ctrl+F5).
2. **Clear site data**: in browser dev tools, Application (Chrome/Edge) or
   Storage (Firefox) tab, clear Service Workers, Cache Storage, and Storage
   for the site, then reload.
3. **Uninstall and reinstall the PWA**: if StudyMap was installed as an app,
   remove it from your device and reinstall from the site to pick up a
   fresh service worker.

If none of these help, the deploy itself likely hasn't shipped yet, so
check the deployment status before assuming it's a caching issue.
