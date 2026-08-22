"use client";

import { useEffect } from "react";

/** Registers the service worker in production so the app works offline. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[PWA] Service worker registration failed:", error);
    });
  }, []);

  return null;
}
