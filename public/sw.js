// StudyMap service worker. Caches the app shell and visited map tiles so the
// map still opens on exam day with a weak or absent signal.

const VERSION = "studymap-v1";
const APP_CACHE = `app-${VERSION}`;
const TILE_CACHE = `tiles-${VERSION}`;
const TILE_LIMIT = 300;
const PRECACHE = ["/", "/offline", "/manifest.webmanifest"];

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
      await Promise.all(
        keys.filter((key) => !key.endsWith(VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await cache.delete(keys[0]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Map tiles: cache-first with a capped store, so we never hoard the whole map.
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILE_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
            trimCache(TILE_CACHE, TILE_LIMIT);
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
