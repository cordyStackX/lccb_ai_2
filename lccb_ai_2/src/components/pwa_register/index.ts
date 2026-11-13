"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.DEV_MODE_ENV !== "production") {
        // Avoid stale caches in dev by unregistering any existing SW.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
        return;
      }

      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}