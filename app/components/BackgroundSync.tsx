"use client";

import { useEffect } from "react";
import { apiUrl } from "@/lib/api";
import { writePreparedHashSets } from "@/lib/waitlistPrepareCache";

const SYNC_COOKIE = "waitlistSynced";
const PREPARE_COOKIE = "waitlistPrepared";
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

        const prepareRes = await fetch(apiUrl("/api/waitlist/prepare"));
        if (!prepareRes.ok) {
          console.error("Waitlist prepare fetch failed:", prepareRes.status);
          return;
        }
        const data = await prepareRes.json();
        if (!data?.success) return;

        writePreparedHashSets(data.registered, data.returning);
        setCookie(PREPARE_COOKIE);
      } catch (error) {
        console.error("Background sync orchestration failed:", error);
      }
    })();
  }, []);

  return null;
}
