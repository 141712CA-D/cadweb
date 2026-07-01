"use client";

import { useEffect } from "react";
import { apiUrl } from "@/lib/api";

const SYNC_COOKIE = "waitlistSynced";
const SYNC_TTL_SECONDS = 3600; // once per hour per browser

function hasCookie(name: string): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`));
}

function setCookie(name: string): void {
  document.cookie = `${name}=1; Max-Age=${SYNC_TTL_SECONDS}; Path=/; SameSite=Lax`;
}

export default function BackgroundSync() {
  useEffect(() => {
    (async () => {
      try {
        // Warm up the API
        await fetch(apiUrl("/api/health"));

        // Background sync for waitlist — throttled to once per hour
        const alreadySynced = hasCookie(SYNC_COOKIE);
        const readyRes = await fetch(apiUrl("/api/cookies/is-sync-ready"), {
          method: "POST",
        });
        if (readyRes.ok) {
          const { isReady } = await readyRes.json();
          if (isReady && !alreadySynced) {
            const syncRes = await fetch(apiUrl("/api/cookies/sync-waitlist"), {
              method: "POST",
            });
            if (syncRes.ok) {
              setCookie(SYNC_COOKIE);
            } else {
              console.error("Background waitlist sync failed:", syncRes.status);
            }
          }
        } else {
          console.error("Background sync readiness check failed:", readyRes.status);
        }
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    })();
  }, []);

  return null;
}
