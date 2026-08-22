// StudyMap service worker template. scripts/build-sw.mjs replaces the build ID
// token before Next.js packages public/sw.js for deployment.

const VERSION = __STUDYMAP_BUILD_ID__;
const APP_CACHE = `studymap-app-${VERSION}`;
const TILE_CACHE = `studymap-tiles-${VERSION}`;
const TILE_LIMIT = 300;
const PRECACHE = ["/", "/map", "/offline", "/manifest.webmanifest"];
const STUDYMAP_CACHE_PREFIXES = ["studymap-app-", "studymap-tiles-"];
const LEGACY_CACHE_NAMES = new Set(["app-studymap-v1", "tiles-studymap-v1"]);
const ACTIVE_CACHES = new Set([APP_CACHE, TILE_CACHE]);

function isStudyMapCache(name) {
  return (
    LEGACY_CACHE_NAMES.has(name) ||
    STUDYMAP_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(PRECACHE).catch((err) =>
        console.warn("[SW] Precache failed:", err),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const staleStudyMapCaches = keys.filter(
        (key) => isStudyMapCache(key) && !ACTIVE_CACHES.has(key),
      );
      await Promise.all(staleStudyMapCaches.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const excess = keys.length - max;
  if (excess <= 0) return;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

// Cache writes are serialized so concurrent tile responses cannot race the
// limit check and leave more than TILE_LIMIT entries behind.
let tileMutationQueue = Promise.resolve();

function cacheTile(request, response) {
  const update = tileMutationQueue.then(async () => {
    const cache = await caches.open(TILE_CACHE);
    await cache.put(request, response);
    await trimCache(TILE_CACHE, TILE_LIMIT);
  });

  // Keep the queue usable even if one cache write fails. The caller still gets
  // the original rejection so it can report the failed cache update.
  tileMutationQueue = update.catch(() => {});
  return update;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Map tiles: cache-first with a capped store, so we never hoard the whole map.
  if (url.hostname === "api.maptiler.com") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILE_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) {
            try {
              await cacheTile(request, res.clone());
            } catch (err) {
              console.warn("[SW] Tile cache update failed:", err);
            }
          }
          return res;
        } catch (err) {
          console.warn("[SW] Tile fetch failed:", err);
          return hit || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Build output and icons never change under a hash: cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Page loads: try the network, fall back to a cached copy, then the shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_CACHE);
        try {
          const res = await fetch(request);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          const home = await cache.match("/");
          if (home) return home;
          const offline = await cache.match("/offline");
          return offline || Response.error();
        }
      })(),
    );
  }
});
