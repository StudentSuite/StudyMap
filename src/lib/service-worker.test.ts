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
