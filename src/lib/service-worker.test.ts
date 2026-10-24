import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const BUILD_SCRIPT = resolve(process.cwd(), "scripts/build-sw.mjs");

function renderServiceWorker(buildId: string) {
  const tempDir = mkdtempSync(join(tmpdir(), "studymap-sw-"));
  const outputPath = join(tempDir, "sw.js");

  try {
    execFileSync(
      process.execPath,
      [BUILD_SCRIPT, `--build-id=${buildId}`, `--output=${outputPath}`],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    return readFileSync(outputPath, "utf8");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const SOURCE = renderServiceWorker("build-123");

type WorkerEventHandler = (event: { waitUntil(promise: Promise<unknown>): void }) => void;

function loadServiceWorker({
  source = SOURCE,
  href = "https://studymap.test/sw.js",
  cacheNames = [] as string[],
  entries = [] as string[],
} = {}) {
  const handlers = new Map<string, WorkerEventHandler>();
  const cacheEntries = [...entries];

  const cache = {
    addAll: vi.fn(async () => {}),
    keys: vi.fn(async () => cacheEntries.map((url) => ({ url }))),
    delete: vi.fn(async (request: { url: string }) => {
      const index = cacheEntries.indexOf(request.url);
      if (index === -1) return false;
      cacheEntries.splice(index, 1);
      return true;
    }),
    put: vi.fn(async (request: { url: string }) => {
      if (!cacheEntries.includes(request.url)) cacheEntries.push(request.url);
    }),
    match: vi.fn(async () => undefined),
  };

  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => cacheNames),
    delete: vi.fn(async () => true),
  };

  const self = {
    location: { href, origin: "https://studymap.test" },
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(),
    addEventListener: vi.fn((name: string, handler: WorkerEventHandler) => {
      handlers.set(name, handler);
    }),
  };

  const context = createContext({
    self,
    caches,
    URL,
    Response,
    console,
    fetch: vi.fn(),
  });
  runInContext(source, context);

  return { cache, cacheEntries, caches, context, handlers, self };
}

async function runWaitUntil(handler: WorkerEventHandler | undefined) {
  expect(handler).toBeDefined();
  let pending: Promise<unknown> | undefined;
  handler!({
    waitUntil(promise) {
      pending = Promise.resolve(promise);
    },
  });
  expect(pending).toBeDefined();
  await pending;
}

describe("service worker cache lifecycle", () => {
  it("bakes the build ID into the generated service-worker bytes", () => {
    const firstBuild = renderServiceWorker("deploy-a");
    const secondBuild = renderServiceWorker("deploy-b");

    expect(firstBuild).not.toBe(secondBuild);
    expect(firstBuild).toContain('const VERSION = "deploy-a";');
    expect(secondBuild).toContain('const VERSION = "deploy-b";');
    expect(firstBuild).not.toContain("__STUDYMAP_BUILD_ID__");
    expect(firstBuild).not.toContain("searchParams");
  });

  it("precaches the map route in the deployment-scoped StudyMap app cache", async () => {
    const runtime = loadServiceWorker();

    await runWaitUntil(runtime.handlers.get("install"));

    expect(runtime.caches.open).toHaveBeenCalledWith("studymap-app-build-123");
    expect(runtime.cache.addAll).toHaveBeenCalledWith([
      "/",
      "/map",
      "/offline",
      "/manifest.webmanifest",
    ]);
  });

  it("removes stale and legacy StudyMap caches without touching generic caches", async () => {
    const runtime = loadServiceWorker({
      cacheNames: [
        "app-studymap-v1",
        "tiles-studymap-v1",
        "studymap-app-old-build",
        "studymap-tiles-old-build",
        "studymap-app-build-123",
        "studymap-tiles-build-123",
        "app-another-product",
        "tiles-another-product",
        "another-app-cache",
      ],
    });

    await runWaitUntil(runtime.handlers.get("activate"));

    expect(runtime.caches.delete).toHaveBeenCalledTimes(4);
    expect(runtime.caches.delete).toHaveBeenCalledWith("app-studymap-v1");
    expect(runtime.caches.delete).toHaveBeenCalledWith("tiles-studymap-v1");
    expect(runtime.caches.delete).toHaveBeenCalledWith("studymap-app-old-build");
    expect(runtime.caches.delete).toHaveBeenCalledWith("studymap-tiles-old-build");
    expect(runtime.caches.delete).not.toHaveBeenCalledWith("studymap-app-build-123");
    expect(runtime.caches.delete).not.toHaveBeenCalledWith("studymap-tiles-build-123");
    expect(runtime.caches.delete).not.toHaveBeenCalledWith("app-another-product");
    expect(runtime.caches.delete).not.toHaveBeenCalledWith("tiles-another-product");
    expect(runtime.caches.delete).not.toHaveBeenCalledWith("another-app-cache");
  });

  it("keeps the tile cache at its limit across queued writes", async () => {
    const initialEntries = Array.from({ length: 300 }, (_, index) => `tile-${index}`);
    const runtime = loadServiceWorker({ entries: initialEntries });

    Object.assign(runtime.context, {
      requestA: { url: "tile-new-a" },
      requestB: { url: "tile-new-b" },
      responseA: {},
      responseB: {},
    });

    const first = runInContext("cacheTile(requestA, responseA)", runtime.context);
    const second = runInContext("cacheTile(requestB, responseB)", runtime.context);
    await Promise.all([first, second]);

    expect(runtime.cacheEntries).toHaveLength(300);
    expect(runtime.cacheEntries).toContain("tile-new-a");
    expect(runtime.cacheEntries).toContain("tile-new-b");
    expect(runtime.cache.delete).toHaveBeenCalledTimes(2);
    expect(runtime.caches.open).toHaveBeenCalledWith("studymap-tiles-build-123");
  });
});

// ---- Page-load caching (#298) ---------------------------------------------------------------
// These tests give every cache name its own store, so they can check that visited pages go to
// their own capped cache and never touch the precached shell in the app cache.

interface FakeResponse {
  ok: boolean;
  status: number;
  type: string;
  body: string;
  clone(): FakeResponse;
}

function fakeResponse(status: number, body: string, type = "basic"): FakeResponse {
  const response: FakeResponse = {
    ok: status >= 200 && status < 300,
    status,
    type,
    body,
    clone: () => response,
  };
  return response;
}

const APP_CACHE_NAME = "studymap-app-build-123";
const PAGES_CACHE_NAME = "studymap-pages-build-123";

function loadNamedCacheWorker(seed: Record<string, string[]> = {}) {
  const handlers = new Map<string, (event: unknown) => void>();
  const stores = new Map<string, Map<string, FakeResponse>>();
  const store = (name: string) => {
    let existing = stores.get(name);
    if (!existing) {
      existing = new Map();
      stores.set(name, existing);
    }
    return existing;
  };
  // Like the real Cache API, resolve a bare path such as "/offline" against the site's origin.
  const keyOf = (request: { url: string } | string) =>
    typeof request === "string"
      ? new URL(request, "https://studymap.test").href
      : request.url;

  for (const [name, urls] of Object.entries(seed)) {
    for (const url of urls) store(name).set(url, fakeResponse(200, url));
  }

  const open = async (name: string) => {
    const entries = store(name);
    return {
      addAll: vi.fn(async () => {}),
      keys: async () => [...entries.keys()].map((url) => ({ url })),
      delete: async (request: { url: string } | string) => entries.delete(keyOf(request)),
      put: async (request: { url: string } | string, response: FakeResponse) => {
        entries.delete(keyOf(request));
        entries.set(keyOf(request), response);
      },
      match: async (request: { url: string } | string) => entries.get(keyOf(request)),
    };
  };

  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };

  const self = {
    location: { href: "https://studymap.test/sw.js", origin: "https://studymap.test" },
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(),
    addEventListener: (name: string, handler: (event: unknown) => void) => {
      handlers.set(name, handler);
    },
  };

  const context = createContext({ self, caches, URL, Response, console, fetch: vi.fn() });
  runInContext(SOURCE, context);

  return { context, handlers, stores };
}

type NamedWorker = ReturnType<typeof loadNamedCacheWorker>;

/** Run one page navigation through the worker; `outcome` is the network response or an Error. */
async function navigate(
  worker: NamedWorker,
  path: string,
  outcome: FakeResponse | Error,
) {
  Object.assign(worker.context, {
    fetch: vi.fn(async () => {
      if (outcome instanceof Error) throw outcome;
      return outcome;
    }),
  });

  let responded: Promise<unknown> | undefined;
  const pending: Promise<unknown>[] = [];
  worker.handlers.get("fetch")!({
    request: { method: "GET", url: `https://studymap.test${path}`, mode: "navigate" },
    respondWith(promise: Promise<unknown>) {
      responded = Promise.resolve(promise);
    },
    waitUntil(promise: Promise<unknown>) {
      pending.push(Promise.resolve(promise));
    },
  });

  expect(responded).toBeDefined();
  const result = (await responded) as FakeResponse;
  await Promise.all(pending);
  return result;
}

const pagesIn = (worker: NamedWorker) => [
  ...(worker.stores.get(PAGES_CACHE_NAME)?.keys() ?? []),
];

describe("service worker page-load caching", () => {
  it("caches a good page in its own pages cache, not the app cache", async () => {
    const worker = loadNamedCacheWorker();
    await navigate(worker, "/city/pune", fakeResponse(200, "pune"));

    expect(pagesIn(worker)).toEqual(["https://studymap.test/city/pune"]);
    expect(worker.stores.get(APP_CACHE_NAME)?.size ?? 0).toBe(0);
  });

  it("writes nothing for a 404 or a 500", async () => {
    const worker = loadNamedCacheWorker();
    const notFound = await navigate(
      worker,
      "/city/nowhere",
      fakeResponse(404, "missing"),
    );
    const broken = await navigate(worker, "/city/pune", fakeResponse(500, "oops"));

    expect(pagesIn(worker)).toEqual([]);
    // the visitor still sees what the network said
    expect(notFound.status).toBe(404);
    expect(broken.status).toBe(500);
  });

  it("keeps the earlier good copy when a later load returns a 500", async () => {
    const worker = loadNamedCacheWorker();
    await navigate(worker, "/city/pune", fakeResponse(200, "good pune"));
    await navigate(worker, "/city/pune", fakeResponse(500, "oops"));

    const offline = await navigate(worker, "/city/pune", new Error("offline"));
    expect(offline.body).toBe("good pune");
  });

  it.each([
    "/account",
    "/account/saved",
    "/login",
    "/onboarding",
    "/auth/callback?code=x",
    "/api/places",
  ])("leaves no cache entry for %s", async (path) => {
    const worker = loadNamedCacheWorker();
    await navigate(worker, path, fakeResponse(200, "private"));

    expect(pagesIn(worker)).toEqual([]);
  });

  it("matches excluded routes by path segment, so look-alike pages still cache", async () => {
    const worker = loadNamedCacheWorker();
    await navigate(worker, "/accountability", fakeResponse(200, "ok"));

    expect(pagesIn(worker)).toEqual(["https://studymap.test/accountability"]);
  });

  it("does not cache opaque or redirected responses", async () => {
    const worker = loadNamedCacheWorker();
    await navigate(worker, "/city/pune", fakeResponse(200, "x", "opaque"));
    await navigate(worker, "/city/delhi", fakeResponse(200, "x", "opaqueredirect"));

    expect(pagesIn(worker)).toEqual([]);
  });

  it("never holds more than its limit and leaves the precached shell alone", async () => {
    const shell = ["/", "/map", "/offline", "/manifest.webmanifest"].map(
      (path) => `https://studymap.test${path}`,
    );
    const worker = loadNamedCacheWorker({ [APP_CACHE_NAME]: shell });

    for (let i = 0; i < 60; i += 1) {
      await navigate(worker, `/city/place-${i}`, fakeResponse(200, `page ${i}`));
    }

    const pages = pagesIn(worker);
    expect(pages).toHaveLength(50);
    expect(pages).toContain("https://studymap.test/city/place-59");
    expect(pages).not.toContain("https://studymap.test/city/place-0");
    expect([...worker.stores.get(APP_CACHE_NAME)!.keys()]).toEqual(shell);
  });

  it("counts every distinct query string as its own entry against the limit", async () => {
    const worker = loadNamedCacheWorker();
    for (let i = 0; i < 70; i += 1) {
      await navigate(worker, `/map?city=c${i}`, fakeResponse(200, `map ${i}`));
    }

    expect(pagesIn(worker)).toHaveLength(50);
  });

  it("offline: a visited page, then the precached page, then home, then /offline", async () => {
    const worker = loadNamedCacheWorker({
      [APP_CACHE_NAME]: ["/", "/map", "/offline"].map((p) => `https://studymap.test${p}`),
    });
    await navigate(worker, "/city/pune", fakeResponse(200, "visited pune"));
    const offline = new Error("offline");

    expect((await navigate(worker, "/city/pune", offline)).body).toBe("visited pune");
    expect((await navigate(worker, "/map", offline)).body).toBe(
      "https://studymap.test/map",
    );
    expect((await navigate(worker, "/city/unknown", offline)).body).toBe(
      "https://studymap.test/",
    );

    worker.stores.get(APP_CACHE_NAME)!.delete("https://studymap.test/");
    expect((await navigate(worker, "/city/unknown", offline)).body).toBe(
      "https://studymap.test/offline",
    );
  });

  it("removes stale pages caches on activate but keeps the current one", async () => {
    const worker = loadNamedCacheWorker({
      "studymap-pages-old-build": ["https://studymap.test/city/pune"],
      [PAGES_CACHE_NAME]: ["https://studymap.test/city/delhi"],
      "another-app-cache": ["https://studymap.test/x"],
    });

    let pending: Promise<unknown> | undefined;
    worker.handlers.get("activate")!({
      waitUntil(promise: Promise<unknown>) {
        pending = Promise.resolve(promise);
      },
    });
    await pending;

    expect([...worker.stores.keys()].sort()).toEqual(
      [PAGES_CACHE_NAME, "another-app-cache"].sort(),
    );
  });
});
