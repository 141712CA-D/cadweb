"use client";

import { useEffect } from "react";
import { apiUrl } from "@/lib/api";

// On page load, check if the backend is ready for a sync via /api/cookies/is-sync-ready.
// If ready, fire /api/cookies/sync-waitlist. Throttled by a short-lived cookie so it
// runs at most once per hour per browser.
const SYNC_COOKIE = "waitlistSynced";
const SYNC_TTL_SECONDS = 3600; // once per hour per browser

export default function BackgroundSync() {
  useEffect(() => {
    const alreadySynced = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${SYNC_COOKIE}=`));
    if (alreadySynced) return;

    // Set the throttle cookie before firing so rapid re-mounts can't double-trigger.
    document.cookie = `${SYNC_COOKIE}=1; Max-Age=${SYNC_TTL_SECONDS}; Path=/; SameSite=Lax`;

    (async () => {
      try {
        const readyRes = await fetch(apiUrl("/api/cookies/is-sync-ready"), {
          method: "POST",
        });
        if (!readyRes.ok) return;
        const { isReady } = await readyRes.json();
        if (!isReady) return;

        fetch(apiUrl("/api/cookies/sync-waitlist"), {
          method: "POST",
        }).catch(() => {});
      } catch {
        // fire-and-forget — silently swallow errors
      }
    })();
  }, []);

  return null;
}
