"use client";

import { useEffect } from "react";
import { apiUrl } from "@/lib/api";

// Fire-and-forget waitlist sync when the site is opened. Hitting the public /prepare
// endpoint triggers a server-side Google-Sheet → DB rebase as a side effect; we ignore
// the response. Throttled by a short-lived cookie so it runs at most once per browser
// per window (across tabs/reloads), rather than on every page load.
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
    fetch(apiUrl("/api/waitlist/prepare")).catch(() => {});
  }, []);

  return null;
}
